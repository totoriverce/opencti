/*
Copyright (c) 2021-2023 Filigran SAS

This file is part of the OpenCTI Enterprise Edition ("EE") and is
licensed under the OpenCTI Non-Commercial License (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

https://github.com/OpenCTI-Platform/opencti/blob/master/LICENSE

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

import { v4 as uuidv4 } from 'uuid';
import { clearIntervalAsync, setIntervalAsync, type SetIntervalAsyncTimer } from 'set-interval-async/fixed';
import { createStreamProcessor, lockResource, redisPlaybookUpdate, type StreamProcessor } from '../database/redis';
import conf, { booleanConf, logApp } from '../config/conf';
import { TYPE_LOCK_ERROR, UnsupportedError } from '../config/errors';
import { executionContext, SYSTEM_USER } from '../utils/access';
import type { SseEvent, StreamDataEvent } from '../types/event';
import type { StixCoreObject, StixBundle } from '../types/stix-common';
import { now } from '../utils/format';
import { findAllPlaybooks, findById } from '../modules/playbook/playbook-domain';
import type { StreamConfiguration } from '../modules/playbook/playbook-components';
import { PLAYBOOK_COMPONENTS } from '../modules/playbook/playbook-components';
import type { ComponentDefinition, PlaybookExecutionStep } from '../modules/playbook/playbook-types';
import { isNotEmptyField } from '../database/utils';
import type { BasicStoreSettings } from '../types/settings';
import type { AuthContext, AuthUser } from '../types/user';
import type { MutationPlaybookStepExecutionArgs } from '../generated/graphql';

const PLAYBOOK_LIVE_KEY = conf.get('playbook_manager:lock_key');
const STREAM_SCHEDULE_TIME = 10000;

export interface ExecutionEnvelop {
  playbook_id: string
  last_execution_step: string | undefined
  [k: `step_${string}`]: {
    // Setup when sending
    in_timestamp: string,
    out_timestamp: string,
    output_port: string | undefined,
    data: StixCoreObject,
    error?: string
  }
}
type ObservationFn = {
  playbookId: string,
  start: string,
  end: string,
  stepId: string,
  bundle: StixBundle
  error?: string
};
const registerObservation = async ({ playbookId, start, end, stepId, bundle, error } : ObservationFn) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const envelop: ExecutionEnvelop = {
    playbook_id: playbookId,
    last_execution_step: stepId,
    [`step_${stepId}`]: { in_timestamp: start, out_timestamp: end, bundle, error }
  };
  await redisPlaybookUpdate(envelop);
};

type ExecutorFn = {
  playbookId: string,
  dataInstanceId: string,
  definition: ComponentDefinition,
  previousStep: PlaybookExecutionStep<any> | null
  nextStep: PlaybookExecutionStep<any>,
  previousBundle: StixBundle | null
  bundle: StixBundle
  isExternalCallback: boolean
};
export const playbookExecutor = async ({
  playbookId,
  dataInstanceId,
  definition,
  previousStep,
  nextStep,
  previousBundle,
  bundle,
  isExternalCallback
} : ExecutorFn) => {
  const start = now();
  try {
    const instanceWithConfig = { ...nextStep.instance, configuration: JSON.parse(nextStep.instance.configuration ?? '{}') };
    if (nextStep.component.is_internal || isExternalCallback) {
      const execution = await nextStep.component.executor({
        instanceId: dataInstanceId,
        playbookId,
        previousInstance: previousStep?.instance,
        instance: instanceWithConfig,
        previousBundle,
        bundle
      });
      // For internal component, register directly the observability
      if (nextStep.component.is_internal) {
        const observation = { stepId: nextStep.instance.id, start, end: now(), playbookId, bundle };
        await registerObservation(observation);
      }
      // Send the result to the next component if needed
      if (execution.output_port) {
        // Find the next op for this attachment
        const connections = definition.links.filter((c) => c.from.id === nextStep.instance.id && c.from.port === execution.output_port);
        for (let connectionIndex = 0; connectionIndex < connections.length; connectionIndex += 1) {
          const connection = connections[connectionIndex];
          const nextInstance = definition.nodes.find((c) => c.id === connection.to.id);
          const fromInstance = definition.nodes.find((c) => c.id === connection.from.id);
          if (!nextInstance || !fromInstance) {
            throw UnsupportedError('Invalid playbook, nextInstance needed');
          }
          const fromConnector = PLAYBOOK_COMPONENTS[fromInstance.component_id];
          const nextConnector = PLAYBOOK_COMPONENTS[nextInstance.component_id];
          await playbookExecutor({
            playbookId,
            dataInstanceId,
            definition,
            previousStep: { component: fromConnector, instance: fromInstance },
            nextStep: { component: nextConnector, instance: nextInstance },
            previousBundle: bundle,
            bundle: execution.bundle,
            isExternalCallback: false
          });
        }
      }
    } else {
      if (!nextStep.component.notify) {
        throw UnsupportedError('Notify definition is required');
      }
      // Component must rely on an external call.
      // Execution will be continued through an external API call
      await nextStep.component.notify({
        instanceId: dataInstanceId,
        playbookId,
        previousInstance: previousStep?.instance,
        instance: instanceWithConfig,
        previousBundle,
        bundle
      });
    }
  } catch (e) {
    logApp.error('Error executing playbook', { error: e });
    const observation = {
      stepId: nextStep.instance.id,
      start,
      end: now(),
      playbookId,
      bundle,
      error: JSON.stringify(e)
    };
    await registerObservation(observation);
  }
};

const playbookStreamHandler = async (streamEvents: Array<SseEvent<StreamDataEvent>>) => {
  try {
    if (streamEvents.length === 0) {
      return;
    }
    const context = executionContext('playbook_manager');
    const opts = { filters: [{ key: 'playbook_running', values: [true] }], connectionFormat: false };
    const playbooks = await findAllPlaybooks(context, SYSTEM_USER, opts);
    for (let index = 0; index < streamEvents.length; index += 1) {
      const streamEvent = streamEvents[index];
      const { data: { data, type } } = streamEvent;
      // For each event we need to check ifs
      for (let playbookIndex = 0; playbookIndex < playbooks.length; playbookIndex += 1) {
        const playbook = playbooks[playbookIndex];
        if (playbook.playbook_definition) {
          const def = JSON.parse(playbook.playbook_definition) as ComponentDefinition;
          // 01. Find the starting point of the playbook
          const instance = def.nodes.find((n) => n.id === playbook.playbook_start);
          if (!instance) {
            throw UnsupportedError('Invalid playbook, entry point needed');
          }
          const connector = PLAYBOOK_COMPONENTS[instance.component_id];
          let validStreamEvent = false;
          const { update, create, delete: deletion } = (JSON.parse(instance.configuration ?? '{}') as StreamConfiguration);
          if (type === 'create' && create === true) validStreamEvent = true;
          if (type === 'update' && update === true) validStreamEvent = true;
          if (type === 'delete' && deletion === true) validStreamEvent = true;
          // 02. Execute the component
          if (validStreamEvent) {
            const nextStep: PlaybookExecutionStep<any> = { component: connector, instance };
            const bundle: StixBundle = { id: uuidv4(), type: 'bundle', objects: [data] };
            await playbookExecutor({
              playbookId: playbook.id,
              dataInstanceId: data.id,
              definition: def,
              previousStep: null,
              nextStep,
              previousBundle: bundle,
              bundle,
              isExternalCallback: false
            });
          }
        }
      }
    }
  } catch (e) {
    logApp.error('[OPENCTI-MODULE] Error executing playbook manager', { error: e });
  }
};

const initPlaybookManager = () => {
  const WAIT_TIME_ACTION = 2000;
  let streamScheduler: SetIntervalAsyncTimer<[]>;
  let streamProcessor: StreamProcessor;
  let running = false;
  let shutdown = false;
  const wait = (ms: number) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  };
  const playbookHandler = async () => {
    let lock;
    try {
      // Lock the manager
      lock = await lockResource([PLAYBOOK_LIVE_KEY], { retryCount: 0 });
      running = true;
      logApp.info('[OPENCTI-MODULE] Running playbook manager');
      streamProcessor = createStreamProcessor(SYSTEM_USER, 'Playbook manager', playbookStreamHandler);
      await streamProcessor.start('live');
      while (!shutdown && streamProcessor.running()) {
        await wait(WAIT_TIME_ACTION);
      }
      logApp.info('[OPENCTI-MODULE] End of playbook manager processing');
    } catch (e: any) {
      if (e.name === TYPE_LOCK_ERROR) {
        logApp.debug('[OPENCTI-MODULE] Playbook manager already started by another API');
      } else {
        logApp.error('[OPENCTI-MODULE] Playbook manager failed to start', { error: e });
      }
    } finally {
      if (streamProcessor) await streamProcessor.shutdown();
      if (lock) await lock.unlock();
    }
  };
  return {
    start: async () => {
      streamScheduler = setIntervalAsync(async () => {
        await playbookHandler();
      }, STREAM_SCHEDULE_TIME);
    },
    status: (settings?: BasicStoreSettings) => {
      return {
        id: 'PLAYBOOK_MANAGER',
        enable: isNotEmptyField(settings?.enterprise_edition) && booleanConf('playbook_manager:enabled', false),
        running,
      };
    },
    shutdown: async () => {
      logApp.info('[OPENCTI-MODULE] Stopping playbook manager');
      shutdown = true;
      if (streamScheduler) await clearIntervalAsync(streamScheduler);
      return true;
    },
  };
};

export const playbookStepExecution = async (context: AuthContext, user: AuthUser, args: MutationPlaybookStepExecutionArgs) => {
  const playbook = await findById(context, user, args.playbook_id);
  if (!playbook) return false;
  const def = JSON.parse(playbook.playbook_definition) as ComponentDefinition;
  const nextInstance = def.nodes.find((n) => n.id === args.step_id);
  const previousInstance = def.nodes.find((n) => n.id === args.previous_step_id);
  if (!nextInstance || !previousInstance) return false;
  const connector = PLAYBOOK_COMPONENTS[nextInstance.component_id];
  // 02. Execute the component
  const nextStep: PlaybookExecutionStep<any> = { component: connector, instance: nextInstance };
  const previousStep: PlaybookExecutionStep<any> = { component: connector, instance: previousInstance };
  // const previousData = JSON.parse(args.previous_data);
  const bundle = JSON.parse(args.bundle) as StixBundle;
  return playbookExecutor({
    playbookId: args.playbook_id,
    dataInstanceId: args.instance_id,
    definition: def,
    previousStep,
    nextStep,
    previousBundle: null,
    bundle,
    isExternalCallback: true
  })
    .then(() => true)
    .catch(() => false);
};

const playbookManager = initPlaybookManager();

export default playbookManager;
