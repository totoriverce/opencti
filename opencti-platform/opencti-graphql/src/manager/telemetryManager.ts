import { clearIntervalAsync, setIntervalAsync, type SetIntervalAsyncTimer } from 'set-interval-async/fixed';
import { ConsoleMetricExporter, InstrumentType, MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { Resource } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import nconf from 'nconf';
import { SEMRESATTRS_SERVICE_INSTANCE_ID } from '@opentelemetry/semantic-conventions/build/src/resource/SemanticResourceAttributes';
import { ExplicitBucketHistogramAggregation } from '@opentelemetry/sdk-metrics/build/src/view/Aggregation';
import { FilteringAttributesProcessor } from '@opentelemetry/sdk-metrics/build/src/view/AttributesProcessor';
import { InstrumentSelector } from '@opentelemetry/sdk-metrics/build/src/view/InstrumentSelector';
import { MeterSelector } from '@opentelemetry/sdk-metrics/build/src/view/MeterSelector';
import conf, { booleanConf, ENABLED_TELEMETRY, logApp, PLATFORM_VERSION } from '../config/conf';
import { lockResource } from '../database/redis';
import { executionContext } from '../utils/access';
import { TYPE_LOCK_ERROR } from '../config/errors';
import { isNotEmptyField } from '../database/utils';
import type { Settings } from '../generated/graphql';
import { getSettings } from '../domain/settings';
import { usersWithActiveSession } from '../database/session';
import { TELEMETRY_SERVICE_NAME, TelemetryMeterManager } from '../config/TelemetryMeterManager';
import { FILE_EXPORTER_PATH, MetricFileExporter } from '../config/MetricFileExporter';

const TELEMETRY_KEY = conf.get('telemetry_manager:lock_key');
const SCHEDULE_TIME = 10000; // record telemetry data period
const EXPORT_INTERVAL = 100000; // TODO set to 1 per day

const createFiligranTelemetryMeterManager = async () => {
  // ------- Telemetry // TODO telemetry service, wrap methods in the service
  let resource = Resource.default();
  const filigranMetricReaders = [];
  if (ENABLED_TELEMETRY) {
    // Fetch settings
    const context = executionContext('telemetry_manager');
    const settings = await getSettings(context) as Settings;
    const plateformId = settings.id;
    // -- Resource
    const filigranResource = new Resource({
      [SEMRESATTRS_SERVICE_NAME]: TELEMETRY_SERVICE_NAME,
      [SEMRESATTRS_SERVICE_VERSION]: PLATFORM_VERSION,
      [SEMRESATTRS_SERVICE_INSTANCE_ID]: plateformId,
    });
    resource = resource.merge(filigranResource);
    // -- Readers with exporter
    // Console Exporter
    const ConsoleExporterReader = new PeriodicExportingMetricReader({
      exporter: new ConsoleMetricExporter(),
      exportIntervalMillis: EXPORT_INTERVAL,
    });
    filigranMetricReaders.push(ConsoleExporterReader);
    // OTLP Exporter
    const otlpUri = nconf.get('app:telemetry:filigran:exporter_otlp');
    if (isNotEmptyField(otlpUri)) {
      const OtlpExporterReader = new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter({ url: otlpUri }),
        exportIntervalMillis: EXPORT_INTERVAL,
      });
      filigranMetricReaders.push(OtlpExporterReader);
    }
    // File exporter for air gap platforms
    const fileExporterReader = new PeriodicExportingMetricReader({
      exporter: new MetricFileExporter(0, FILE_EXPORTER_PATH),
      exportIntervalMillis: EXPORT_INTERVAL,
    });
    filigranMetricReaders.push(fileExporterReader);
  }
  const filigranMeterProvider = new MeterProvider(({
    resource,
    readers: filigranMetricReaders,
    views: [{
      aggregation: new ExplicitBucketHistogramAggregation([0, 1, 2, 3]),
      attributesProcessor: new FilteringAttributesProcessor([]),
      instrumentSelector: new InstrumentSelector({ type: InstrumentType.HISTOGRAM }),
      meterSelector: new MeterSelector(),
    }],
  }));

  const filigranTelemetryMeterManager = new TelemetryMeterManager(filigranMeterProvider);
  filigranTelemetryMeterManager.registerFiligranTelemetry();
  return filigranTelemetryMeterManager;
};

const fetchTelemetryData = async (filigranTelemetryMeterManager: TelemetryMeterManager) => {
  try {
    const context = executionContext('telemetry_manager');
    // Fetch settings
    const settings = await getSettings(context) as Settings;
    // Set filigranTelemetryManager settings telemetry data
    filigranTelemetryMeterManager.setIsEEActivated(isNotEmptyField(settings.enterprise_edition) ? 1 : 0);
    filigranTelemetryMeterManager.setEEActivationDate(settings.enterprise_edition);
    filigranTelemetryMeterManager.setNumberOfInstances(settings.platform_cluster.instances_number);
    // Get number of active users since fetchTelemetryData() last execution
    const activUsers = await usersWithActiveSession(SCHEDULE_TIME / 1000 / 60);
    filigranTelemetryMeterManager.setActivUsersHistogram(activUsers.length);
  } catch (e) {
    logApp.error(e, { manager: 'TELEMETRY_MANAGER' });
  }
};

const initTelemetryManager = () => {
  let scheduler: SetIntervalAsyncTimer<[]>;
  let running = false;

  const telemetryHandler = async (filigranTelemetryMeterManager: TelemetryMeterManager) => {
    let lock;
    try {
      // Lock the manager
      lock = await lockResource([TELEMETRY_KEY], { retryCount: 0 });
      running = true;
      await fetchTelemetryData(filigranTelemetryMeterManager);
    } catch (e: any) {
      if (e.name === TYPE_LOCK_ERROR) {
        logApp.debug('[OPENCTI-MODULE] Telemetry manager already started by another API');
      } else {
        logApp.error(e, { manager: 'TELEMETRY_MANAGER' });
      }
    } finally {
      running = false;
      logApp.debug('[OPENCTI-MODULE] Telemetry manager done');
      if (lock) await lock.unlock();
    }
  };

  return {
    start: async () => {
      logApp.info('[OPENCTI-MODULE] Starting telemetry manager');
      const filigranTelemetryMeterManager = await createFiligranTelemetryMeterManager();
      // Fetch data periodically
      scheduler = setIntervalAsync(async () => {
        await telemetryHandler(filigranTelemetryMeterManager);
      }, SCHEDULE_TIME);
    },
    status: () => {
      return {
        id: 'TELEMETRY_MANAGER',
        enable: booleanConf('telemetry_manager:enabled', false),
        running,
      };
    },
    shutdown: async () => {
      logApp.info('[OPENCTI-MODULE] Stopping telemetry manager');
      if (scheduler) {
        await clearIntervalAsync(scheduler);
      }
      return true;
    },
  };
};
const telemetryManager = initTelemetryManager();

export default telemetryManager;