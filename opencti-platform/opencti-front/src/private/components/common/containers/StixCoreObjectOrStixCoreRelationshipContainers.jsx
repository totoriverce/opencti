import React from 'react';
import makeStyles from '@mui/styles/makeStyles';
import Box from '@mui/material/Box';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import Tooltip from '@mui/material/Tooltip';
import { FileDownloadOutlined, ViewListOutlined } from '@mui/icons-material';
import { VectorPolygon } from 'mdi-material-ui';
import { QueryRenderer } from '../../../../relay/environment';
import ListLines from '../../../../components/list_lines/ListLines';
import StixCoreObjectOrStixCoreRelationshipContainersLines, {
  stixCoreObjectOrStixCoreRelationshipContainersLinesQuery,
} from './StixCoreObjectOrStixCoreRelationshipContainersLines';
import StixCoreObjectOrStixCoreRelationshipContainersGraph, {
  stixCoreObjectOrStixCoreRelationshipContainersGraphQuery,
} from './StixCoreObjectOrStixCoreRelationshipContainersGraph';
import Loader from '../../../../components/Loader';
import StixCoreObjectOrStixCoreRelationshipContainersGraphBar from './StixCoreObjectOrStixCoreRelationshipContainersGraphBar';
import SearchInput from '../../../../components/SearchInput';
import useAuth from '../../../../utils/hooks/useAuth';
import Filters from '../lists/Filters';
import FilterIconButton from '../../../../components/FilterIconButton';
import { usePaginationLocalStorage } from '../../../../utils/hooks/useLocalStorage';
import { emptyFilterGroup, isFilterGroupNotEmpty, removeIdFromFilterGroupObject } from '../../../../utils/filters/filtersUtils';
import { useFormatter } from '../../../../components/i18n';

const useStyles = makeStyles(() => ({
  container: {
    paddingBottom: 70,
  },
  containerGraph: {
    paddingBottom: 0,
  },
}));
const StixCoreObjectOrStixCoreRelationshipContainers = ({
  stixDomainObjectOrStixCoreRelationship,
  authorId,
  onChangeOpenExports,
  reportType,
}) => {
  const { t } = useFormatter();
  const classes = useStyles();
  const {
    platformModuleHelpers: { isRuntimeFieldEnable },
  } = useAuth();
  const isRuntimeSort = isRuntimeFieldEnable() ?? false;
  const LOCAL_STORAGE_KEY = `containers${
    stixDomainObjectOrStixCoreRelationship
      ? `-${stixDomainObjectOrStixCoreRelationship.id}`
      : `-${authorId}`
  }`;

  const { viewStorage, paginationOptions, helpers } = usePaginationLocalStorage(
    LOCAL_STORAGE_KEY,
    {
      filters: emptyFilterGroup,
      searchTerm: '',
      sortBy: 'created',
      orderAsc: false,
      openExports: false,
      view: 'lines',
      redirectionMode: 'overview',
    },
  );

  const {
    numberOfElements,
    filters,
    searchTerm,
    sortBy,
    orderAsc,
    redirectionMode,
    view,
    openExports,
  } = viewStorage;

  const reportFilterClass = reportType !== 'all' && reportType !== undefined ? reportType.replace(/_/g, ' ') : '';
  const userFilters = removeIdFromFilterGroupObject(filters);
  const contextFilters = {
    mode: 'and',
    filters: [
      { key: 'entity_type', operator: 'eq', mode: 'or', values: ['Container'] },
      ...(reportFilterClass ? [{ key: 'report_types', values: [reportFilterClass], operator: 'eq', mode: 'or' }] : []),
      ...(authorId ? [{ key: 'createdBy', values: [authorId], operator: 'eq', mode: 'or' }] : []),
      ...(stixDomainObjectOrStixCoreRelationship?.id ? [{ key: 'objects', values: [stixDomainObjectOrStixCoreRelationship.id], operator: 'eq', mode: 'or' }] : []),
    ],
    filterGroups: userFilters && isFilterGroupNotEmpty(userFilters) ? [userFilters] : [],
  };
  const queryPaginationOptions = { ...paginationOptions, filters: contextFilters };

  const dataColumns = {
    entity_type: {
      label: 'Type',
      width: '8%',
      isSortable: true,
    },
    name: {
      label: 'Title',
      width: '25%',
      isSortable: true,
    },
    createdBy: {
      label: 'Author',
      width: '12%',
      isSortable: isRuntimeSort,
    },
    creator: {
      label: 'Creators',
      width: '12%',
      isSortable: isRuntimeSort,
    },
    objectLabel: {
      label: 'Labels',
      width: '15%',
      isSortable: false,
    },
    created: {
      label: 'Date',
      width: '10%',
      isSortable: true,
    },
    x_opencti_workflow_id: {
      label: 'Status',
      width: '8%',
      isSortable: true,
    },
    objectMarking: {
      label: 'Marking',
      width: '8%',
      isSortable: isRuntimeSort,
    },
  };

  const renderLines = () => {
    return (
      <ListLines
        helpers={helpers}
        sortBy={sortBy}
        orderAsc={orderAsc}
        dataColumns={dataColumns}
        handleSort={helpers.handleSort}
        handleSearch={helpers.handleSearch}
        handleAddFilter={helpers.handleAddFilter}
        handleRemoveFilter={helpers.handleRemoveFilter}
        handleSwitchGlobalMode={helpers.handleSwitchGlobalMode}
        handleSwitchLocalMode={helpers.handleSwitchLocalMode}
        handleToggleExports={helpers.handleToggleExports}
        handleChangeView={helpers.handleChangeView}
        openExports={openExports}
        noPadding={typeof onChangeOpenExports === 'function'}
        exportContext={{ entity_type: 'Container' }}
        keyword={searchTerm}
        handleSwitchRedirectionMode={(value) => helpers.handleAddProperty('redirectionMode', value)}
        redirectionMode={redirectionMode}
        filters={filters}
        paginationOptions={queryPaginationOptions}
        numberOfElements={numberOfElements}
        disableCards={true}
        enableGraph={true}
        availableFilterKeys={[
          'report_types',
          'entity_type',
          'confidence',
          'workflow_id',
          'objectLabel',
          'createdBy',
          'objectMarking',
          'created',
        ]}
      >
        <QueryRenderer
          query={stixCoreObjectOrStixCoreRelationshipContainersLinesQuery}
          variables={queryPaginationOptions}
          render={({ props }) => (
            <StixCoreObjectOrStixCoreRelationshipContainersLines
              data={props}
              paginationOptions={queryPaginationOptions}
              dataColumns={dataColumns}
              initialLoading={props === null}
              onLabelClick={helpers.handleAddFilter}
              setNumberOfElements={helpers.handleSetNumberOfElements}
              redirectionMode={redirectionMode}
            />
          )}
        />
      </ListLines>
    );
  };

  const renderGraph = () => {
    const availableFilterKeys = [
      'objectLabel',
      'createdBy',
      'objectMarking',
      'created',
      'entity_type',
      'report_types',
    ];
    return (
      <>
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '-10px',
          paddingBottom: '10px',
        }}
        >
          <Box sx={{
            gap: '10px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
          >
            <SearchInput
              variant="small"
              onSubmit={helpers.handleSearch}
              keyword={searchTerm}
            />
            <Filters
              helpers={helpers}
              availableFilterKeys={availableFilterKeys}
              handleAddFilter={helpers.handleAddFilter}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {numberOfElements && (
            <div>
              <strong>{`${numberOfElements.number}${numberOfElements.symbol}`}</strong>{' '}
              {t('entitie(s)')}
            </div>
            )}
            <ToggleButtonGroup
              size="small"
              color="secondary"
              value="graph"
              exclusive={true}
              onChange={(_, value) => {
                if (value && value === 'export') {
                  helpers.handleToggleExports();
                } else if (value) {
                  helpers.handleChangeView(value);
                }
              }}
            >
              <ToggleButton value="lines" aria-label="lines">
                <Tooltip title={t('Lines view')}>
                  <ViewListOutlined fontSize="small" color="primary" />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="graph" aria-label="graph">
                <Tooltip title={t('Graph view')}>
                  <VectorPolygon fontSize="small" />
                </Tooltip>
              </ToggleButton>
              <ToggleButton
                value="export"
                aria-label="export"
                disabled={true}
              >
                <Tooltip title={t('Open export panel')}>
                  <FileDownloadOutlined fontSize="small" />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

        </Box>
        <FilterIconButton
          helpers={helpers}
          filters={filters}
          handleRemoveFilter={helpers.handleRemoveFilter}
          handleSwitchLocalMode={helpers.handleSwitchLocalMode}
          handleSwitchGlobalMode={helpers.handleSwitchGlobalMode}
          className={5}
          redirection
        />
        <QueryRenderer
          query={stixCoreObjectOrStixCoreRelationshipContainersGraphQuery}
          variables={{
            id: stixDomainObjectOrStixCoreRelationship.id,
            types: [
              'Threat-Actor',
              'Intrusion-Set',
              'Campaign',
              'Incident',
              'Malware',
              'Tool',
              'Vulnerability',
              'Attack-Pattern',
              'Sector',
              'Organization',
              'Individual',
              'Region',
              'Country',
              'City',
              'uses',
              'targets',
              'attributed-to',
              'located-at',
              'part-of',
              'employed-by',
              'resides-in',
              'citizen-of',
              'national-of',
              'belongs-to',
              'related-to',
            ],
            filters: queryPaginationOptions.filters,
            search: searchTerm,
          }}
          render={({ props }) => {
            if (props) {
              return (
                <StixCoreObjectOrStixCoreRelationshipContainersGraph
                  stixDomainObjectOrStixCoreRelationship={
                    stixDomainObjectOrStixCoreRelationship
                  }
                  data={props}
                  handleChangeView={helpers.handleChangeView}
                />
              );
            }
            return (
              <>
                <StixCoreObjectOrStixCoreRelationshipContainersGraphBar
                  disabled={true}
                />
                <Loader />
              </>
            );
          }}
        />
      </>
    );
  };

  return (
    <div
      className={view === 'lines' ? classes.container : classes.containerGraph}
    >
      {view === 'lines' ? renderLines() : ''}
      {view === 'graph' ? renderGraph() : ''}
    </div>
  );
};

export default StixCoreObjectOrStixCoreRelationshipContainers;
