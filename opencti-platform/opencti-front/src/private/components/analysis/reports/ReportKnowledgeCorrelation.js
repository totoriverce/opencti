import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import * as R from 'ramda';
import SpriteText from 'three-spritetext';
import { debounce } from 'rxjs/operators';
import { Subject, timer } from 'rxjs';
import { graphql, createFragmentContainer } from 'react-relay';
import ForceGraph2D from 'react-force-graph-2d';
import ForceGraph3D from 'react-force-graph-3d';
import withTheme from '@mui/styles/withTheme';
import { withRouter } from 'react-router-dom';
import RectangleSelection from 'react-rectangle-selection';
import inject18n from '../../../../components/i18n';
import { commitMutation, fetchQuery } from '../../../../relay/environment';
import {
  buildCorrelationData,
  computeTimeRangeInterval,
  computeTimeRangeValues,
  decodeGraphData,
  encodeGraphData,
  linkPaint,
  nodeAreaPaint,
  nodePaint,
  nodeThreePaint,
} from '../../../../utils/Graph';
import {
  buildViewParamsFromUrlAndStorage,
  saveViewParameters,
} from '../../../../utils/ListParameters';
import ReportKnowledgeGraphBar from './ReportKnowledgeGraphBar';
import { reportMutationFieldPatch } from './ReportEditionOverview';

const PARAMETERS$ = new Subject().pipe(debounce(() => timer(2000)));
const POSITIONS$ = new Subject().pipe(debounce(() => timer(2000)));

export const reportKnowledgeCorrelationQuery = graphql`
  query ReportKnowledgeCorrelationQuery($id: String) {
    report(id: $id) {
      ...ReportKnowledgeCorrelation_report
    }
  }
`;

const reportKnowledgeCorrelationStixCoreObjectQuery = graphql`
  query ReportKnowledgeCorrelationStixCoreObjectQuery($id: String!) {
    stixCoreObject(id: $id) {
      id
      entity_type
      parent_types
      created_at
      createdBy {
        ... on Identity {
          id
          name
          entity_type
        }
      }
      objectMarking {
        edges {
          node {
            id
            definition_type
            definition
            x_opencti_order
            x_opencti_color
          }
        }
      }
      ... on StixDomainObject {
        created
      }
      ... on AttackPattern {
        name
        x_mitre_id
      }
      ... on Campaign {
        name
        first_seen
        last_seen
      }
      ... on CourseOfAction {
        name
      }
      ... on Individual {
        name
      }
      ... on Organization {
        name
      }
      ... on Sector {
        name
      }
      ... on Indicator {
        name
        valid_from
      }
      ... on Infrastructure {
        name
      }
      ... on IntrusionSet {
        name
        first_seen
        last_seen
      }
      ... on Position {
        name
      }
      ... on City {
        name
      }
      ... on AdministrativeArea {
        name
      }
      ... on Country {
        name
      }
      ... on Region {
        name
      }
      ... on Malware {
        name
        first_seen
        last_seen
      }
      ... on ThreatActor {
        name
        first_seen
        last_seen
      }
      ... on Tool {
        name
      }
      ... on Vulnerability {
        name
      }
      ... on Incident {
        name
        first_seen
        last_seen
      }
      ... on StixCyberObservable {
        observable_value
      }
      ... on StixFile {
        observableName: name
      }
    }
  }
`;

const reportKnowledgeCorrelationStixCoreRelationshipQuery = graphql`
  query ReportKnowledgeCorrelationStixCoreRelationshipQuery($id: String!) {
    stixCoreRelationship(id: $id) {
      id
      entity_type
      parent_types
      start_time
      stop_time
      created
      confidence
      relationship_type
      from {
        ... on BasicObject {
          id
          entity_type
          parent_types
        }
        ... on BasicRelationship {
          id
          entity_type
          parent_types
        }
        ... on StixCoreRelationship {
          relationship_type
        }
      }
      to {
        ... on BasicObject {
          id
          entity_type
          parent_types
        }
        ... on BasicRelationship {
          id
          entity_type
          parent_types
        }
        ... on StixCoreRelationship {
          relationship_type
        }
      }
      created_at
      createdBy {
        ... on Identity {
          id
          name
          entity_type
        }
      }
      objectMarking {
        edges {
          node {
            id
            definition_type
            definition
            x_opencti_order
            x_opencti_color
          }
        }
      }
    }
  }
`;

class ReportKnowledgeCorrelationComponent extends Component {
  constructor(props) {
    super(props);
    this.initialized = false;
    this.zoomed = 0;
    this.graph = React.createRef();
    this.selectedNodes = new Set();
    this.selectedLinks = new Set();
    const params = buildViewParamsFromUrlAndStorage(
      props.history,
      props.location,
      `view-report-${props.report.id}-knowledge-correlation`,
    );
    this.zoom = R.propOr(null, 'zoom', params);
    this.graphObjects = R.map((n) => n.node, props.report.objects.edges);
    const stixCoreObjectsTypes = R.pipe(
      R.map((n) => n.node.entity_type),
      R.filter((n) => n && n.length > 0),
      R.uniq,
    )(props.report.objects.edges);
    const markedBy = R.uniq(
      R.concat(
        R.pipe(
          R.filter((m) => m.node.objectMarking),
          R.map((m) => m.node.objectMarking.edges),
          R.flatten,
          R.map((m) => m.node.id),
        )(props.report.objects.edges),
        R.pipe(
          R.filter((m) => m.node.reports),
          R.map((m) => m.node.reports.edges),
          R.flatten,
          R.map((m) => m.node.objectMarking.edges),
          R.flatten,
          R.map((m) => m.node.id),
        )(props.report.objects.edges),
      ),
    );
    const createdBy = R.uniq(
      R.concat(
        R.pipe(
          R.filter((m) => m.node.createdBy),
          R.map((m) => m.node.createdBy),
          R.flatten,
          R.filter((m) => m.id),
          R.map((n) => n.id),
        )(props.report.objects.edges),
        R.pipe(
          R.filter((m) => m && m.node.reports),
          R.map((m) => m.node.reports.edges),
          R.flatten,
          R.map((m) => m.node.createdBy),
          R.flatten,
          R.filter((m) => m && m.id),
          R.map((n) => n.id),
        )(props.report.objects.edges),
      ),
    );
    const timeRangeInterval = computeTimeRangeInterval(
      R.uniqBy(
        R.prop('id'),
        R.pipe(
          R.filter((n) => n.node.reports),
          R.map((n) => n.node.reports.edges),
          R.flatten,
          R.map((n) => n.node),
        )(props.report.objects.edges),
      ),
    );
    this.state = {
      mode3D: R.propOr(false, 'mode3D', params),
      selectModeFree: R.propOr(false, 'selectModeFree', params),
      rectSelected: { origin: [0, 0], target: [0, 0], shiftKey: false, altKey: false },
      modeFixed: R.propOr(false, 'modeFixed', params),
      modeTree: R.propOr('', 'modeTree', params),
      selectedTimeRangeInterval: timeRangeInterval,
      stixCoreObjectsTypes,
      markedBy,
      createdBy,
      numberOfSelectedNodes: 0,
      numberOfSelectedLinks: 0,
      keyword: '',
    };
    const filterAdjust = {
      markedBy,
      createdBy,
      stixCoreObjectsTypes,
      excludedStixCoreObjectsTypes: [],
      selectedTimeRangeInterval: timeRangeInterval,
    };
    this.graphData = buildCorrelationData(
      this.graphObjects,
      decodeGraphData(props.report.x_opencti_graph_data),
      props.t,
      filterAdjust,
    );
    this.state.graphData = { ...this.graphData };
  }

  initialize() {
    if (this.initialized) return;
    if (this.graph && this.graph.current) {
      this.graph.current.d3Force('link').distance(50);
      if (this.state.modeTree !== '') {
        this.graph.current.d3Force('charge').strength(-5000);
      }
      if (this.zoomed < 2) {
        if (this.zoom && this.zoom.k && !this.state.mode3D) {
          this.graph.current.zoom(this.zoom.k, 400);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-this-alias
          const currentContext = this;
          setTimeout(
            () => currentContext.graph
              && currentContext.graph.current
              && currentContext.graph.current.zoomToFit(0, 150),
            1200,
          );
        }
      }
      this.initialized = true;
      this.zoomed += 1;
    }
  }

  componentDidMount() {
    this.subscription = PARAMETERS$.subscribe({
      next: () => this.saveParameters(),
    });
    this.subscription = POSITIONS$.subscribe({
      next: () => this.savePositions(),
    });
    this.initialize();
  }

  componentWillUnmount() {
    this.subscription.unsubscribe();
  }

  saveParameters(refreshGraphData = false) {
    saveViewParameters(
      this.props.history,
      this.props.location,
      `view-report-${this.props.report.id}-knowledge-correlation`,
      { zoom: this.zoom, ...this.state },
    );
    if (refreshGraphData) {
      this.setState({
        graphData: { ...this.graphData },
      });
    }
  }

  savePositions() {
    const initialPositions = R.indexBy(
      R.prop('id'),
      R.map((n) => ({ id: n.id, x: n.fx, y: n.fy }), this.graphData.nodes),
    );
    const newPositions = R.indexBy(
      R.prop('id'),
      R.map((n) => ({ id: n.id, x: n.fx, y: n.fy }), this.state.graphData.nodes),
    );
    const positions = R.mergeLeft(newPositions, initialPositions);
    commitMutation({
      mutation: reportMutationFieldPatch,
      variables: {
        id: this.props.report.id,
        input: {
          key: 'x_opencti_graph_data',
          value: encodeGraphData(positions),
        },
      },
    });
  }

  handleToggle3DMode() {
    this.setState({ mode3D: !this.state.mode3D }, () => this.saveParameters());
  }

  handleToggleSelectModeFree() {
    this.setState({ selectModeFree: !this.state.selectModeFree }, () => this.saveParameters());
  }

  handleToggleTreeMode(modeTree) {
    if (modeTree === 'horizontal') {
      this.setState(
        {
          modeTree: this.state.modeTree === 'horizontal' ? '' : 'horizontal',
        },
        () => {
          if (this.state.modeTree === 'horizontal') {
            this.graph.current.d3Force('charge').strength(-5000);
          } else {
            this.graph.current.d3Force('charge').strength(-30);
          }
          this.saveParameters();
        },
      );
    } else if (modeTree === 'vertical') {
      this.setState(
        {
          modeTree: this.state.modeTree === 'vertical' ? '' : 'vertical',
        },
        () => {
          if (this.state.modeTree === 'vertical') {
            this.graph.current.d3Force('charge').strength(-5000);
          } else {
            this.graph.current.d3Force('charge').strength(-30);
          }
          this.saveParameters();
        },
      );
    }
  }

  handleToggleFixedMode() {
    this.setState({ modeFixed: !this.state.modeFixed }, () => {
      this.saveParameters();
      this.handleDragEnd();
      this.forceUpdate();
      this.graph.current.d3ReheatSimulation();
    });
  }

  handleToggleDisplayTimeRange() {
    this.setState({ displayTimeRange: !this.state.displayTimeRange }, () => this.saveParameters());
  }

  handleToggleStixCoreObjectType(type) {
    const { stixCoreObjectsTypes } = this.state;
    const filterAdjust = {
      markedBy: this.state.markedBy,
      createdBy: this.state.createdBy,
      stixCoreObjectsTypes: stixCoreObjectsTypes.includes(type)
        ? R.filter((t) => t !== type, stixCoreObjectsTypes)
        : R.append(type, stixCoreObjectsTypes),
      selectedTimeRangeInterval: this.state.selectedTimeRangeInterval,
      keyword: this.state.keyword,
    };
    this.setState(
      {
        stixCoreObjectsTypes: filterAdjust.stixCoreObjectsTypes,
        graphData: buildCorrelationData(
          this.graphObjects,
          decodeGraphData(this.props.report.x_opencti_graph_data),
          this.props.t,
          filterAdjust,
        ),
      },
      () => this.saveParameters(false),
    );
  }

  handleToggleMarkedBy(markingDefinition) {
    const { markedBy } = this.state;
    const filterAdjust = {
      markedBy: this.state.markedBy.includes(markingDefinition)
        ? R.filter((t) => t !== markingDefinition, markedBy)
        : R.append(markingDefinition, markedBy),
      createdBy: this.state.createdBy,
      stixCoreObjectsTypes: this.state.stixCoreObjectsTypes,
      selectedTimeRangeInterval: this.state.selectedTimeRangeInterval,
      keyword: this.state.keyword,
    };
    this.setState(
      {
        markedBy: filterAdjust.markedBy,
        graphData: buildCorrelationData(
          this.graphObjects,
          decodeGraphData(this.props.report.x_opencti_graph_data),
          this.props.t,
          filterAdjust,
        ),
      },
      () => this.saveParameters(false),
    );
  }

  handleToggleCreateBy(createdByRef) {
    const { createdBy } = this.state;
    const filterAdjust = {
      markedBy: this.state.markedBy,
      createdBy: createdBy.includes(createdByRef)
        ? R.filter((t) => t !== createdByRef, createdBy)
        : R.append(createdByRef, createdBy),
      stixCoreObjectsTypes: this.state.stixCoreObjectsTypes,
      selectedTimeRangeInterval: this.state.selectedTimeRangeInterval,
      keyword: this.state.keyword,
    };
    this.setState(
      {
        createdBy: filterAdjust.createdBy,
        graphData: buildCorrelationData(
          this.graphObjects,
          decodeGraphData(this.props.report.x_opencti_graph_data),
          this.props.t,
          filterAdjust,
        ),
      },
      () => this.saveParameters(false),
    );
  }

  handleZoomToFit() {
    this.graph.current.zoomToFit(400, 150);
  }

  onZoom() {
    this.zoomed += 1;
  }

  handleZoomEnd(zoom) {
    if (
      this.initialized
      && (zoom.k !== this.zoom?.k
        || zoom.x !== this.zoom?.x
        || zoom.y !== this.zoom?.y)
    ) {
      this.zoom = zoom;
      PARAMETERS$.next({ action: 'SaveParameters' });
    }
  }

  // eslint-disable-next-line class-methods-use-this
  handleDragEnd() {
    POSITIONS$.next({ action: 'SavePositions' });
  }

  handleNodeClick(node, event) {
    if (event.ctrlKey || event.shiftKey || event.altKey) {
      if (this.selectedNodes.has(node)) {
        this.selectedNodes.delete(node);
      } else {
        this.selectedNodes.add(node);
      }
    } else {
      const untoggle = this.selectedNodes.has(node) && this.selectedNodes.size === 1;
      this.selectedNodes.clear();
      this.selectedLinks.clear();
      if (!untoggle) this.selectedNodes.add(node);
    }
    this.setState({
      numberOfSelectedNodes: this.selectedNodes.size,
      numberOfSelectedLinks: this.selectedLinks.size,
    });
  }

  handleLinkClick(link, event) {
    if (event.ctrlKey || event.shiftKey || event.altKey) {
      if (this.selectedLinks.has(link)) {
        this.selectedLinks.delete(link);
      } else {
        this.selectedLinks.add(link);
      }
    } else {
      const untoggle = this.selectedLinks.has(link) && this.selectedLinks.size === 1;
      this.selectedNodes.clear();
      this.selectedLinks.clear();
      if (!untoggle) {
        this.selectedLinks.add(link);
      }
    }
    this.setState({
      numberOfSelectedNodes: this.selectedNodes.size,
      numberOfSelectedLinks: this.selectedLinks.size,
    });
  }

  handleBackgroundClick() {
    this.selectedNodes.clear();
    this.selectedLinks.clear();
    this.setState({
      numberOfSelectedNodes: this.selectedNodes.size,
      numberOfSelectedLinks: this.selectedLinks.size,
    });
  }

  handleCloseEntityEdition(entityId) {
    setTimeout(() => {
      fetchQuery(reportKnowledgeCorrelationStixCoreObjectQuery, {
        id: entityId,
      })
        .toPromise()
        .then((data) => {
          const { stixCoreObject } = data;
          this.graphObjects = R.map(
            (n) => (n.id === stixCoreObject.id ? stixCoreObject : n),
            this.graphObjects,
          );
          this.graphData = buildCorrelationData(
            this.graphObjects,
            decodeGraphData(this.props.report.x_opencti_graph_data),
            this.props.t,
            this.state,
          );
          this.setState({
            graphData: { ...this.graphData },
          });
        });
    }, 1500);
  }

  handleCloseRelationEdition(relationId) {
    setTimeout(() => {
      fetchQuery(reportKnowledgeCorrelationStixCoreRelationshipQuery, {
        id: relationId,
      })
        .toPromise()
        .then((data) => {
          const { stixCoreRelationship } = data;
          this.graphObjects = R.map(
            (n) => (n.id === stixCoreRelationship.id ? stixCoreRelationship : n),
            this.graphObjects,
          );
          this.graphData = buildCorrelationData(
            this.graphObjects,
            decodeGraphData(this.props.report.x_opencti_graph_data),
            this.props.t,
            this.state,
          );
          this.setState({
            graphData: { ...this.graphData },
          });
        });
    }, 1500);
  }

  inSelectionRect(n) {
    const graphOrigin = this.graph.current.screen2GraphCoords(this.state.rectSelected.origin[0], this.state.rectSelected.origin[1]);
    const graphTarget = this.graph.current.screen2GraphCoords(this.state.rectSelected.target[0], this.state.rectSelected.target[1]);
    return (n.x >= graphOrigin.x) && (n.x <= graphTarget.x)
      && (n.y >= graphOrigin.y) && (n.y <= graphTarget.y);
  }

  handleRectSelectMove(e, coords) {
    if (
      this.state.selectModeFree
    ) {
      const container = document.getElementsByTagName('canvas')[0];
      const { left, top } = container.getBoundingClientRect();
      this.state.rectSelected.origin[0] = R.min(coords.origin[0], coords.target[0]) - left;
      this.state.rectSelected.origin[1] = R.min(coords.origin[1], coords.target[1]) - top;
      this.state.rectSelected.target[0] = R.max(coords.origin[0], coords.target[0]) - left;
      this.state.rectSelected.target[1] = R.max(coords.origin[1], coords.target[1]) - top;
      this.state.rectSelected.shiftKey = e.shiftKey;
      this.state.rectSelected.altKey = e.altKey;
    }
  }

  handleRectSelectUp() {
    if (
      this.state.selectModeFree
      && (
        this.state.rectSelected.origin[0] !== this.state.rectSelected.target[0]
        || this.state.rectSelected.origin[1] !== this.state.rectSelected.target[1]
      )
    ) {
      if (
        !this.state.rectSelected.shiftKey && !this.state.rectSelected.altKey
      ) {
        this.selectedLinks.clear();
        this.selectedNodes.clear();
      }
      if (this.state.rectSelected.altKey) {
        R.map((n) => this.inSelectionRect(n) && this.selectedNodes.delete(n), this.state.graphData.nodes);
      } else {
        R.map((n) => this.inSelectionRect(n) && this.selectedNodes.add(n), this.state.graphData.nodes);
      }
      this.setState({ numberOfSelectedNodes: this.selectedNodes.size });
    }
    this.state.rectSelected = { origin: [0, 0], target: [0, 0], shiftKey: false, altKey: false };
  }

  handleSelectAll() {
    this.selectedLinks.clear();
    this.selectedNodes.clear();
    R.map((n) => this.selectedNodes.add(n), this.state.graphData.nodes);
    this.setState({ numberOfSelectedNodes: this.selectedNodes.size });
  }

  handleSelectByType(type) {
    this.selectedLinks.clear();
    this.selectedNodes.clear();
    R.map(
      (n) => n.entity_type === type && this.selectedNodes.add(n),
      this.state.graphData.nodes,
    );
    this.setState({ numberOfSelectedNodes: this.selectedNodes.size });
  }

  handleResetLayout() {
    this.graphData = buildCorrelationData(
      this.graphObjects,
      {},
      this.props.t,
      this.state,
    );
    this.setState(
      {
        graphData: { ...this.graphData },
      },
      () => {
        this.handleDragEnd();
        this.forceUpdate();
        this.graph.current.d3ReheatSimulation();
        POSITIONS$.next({ action: 'SavePositions' });
      },
    );
  }

  handleTimeRangeChange(selectedTimeRangeInterval) {
    const filterAdjust = {
      selectedTimeRangeInterval,
      markedBy: this.state.markedBy,
      createdBy: this.state.createdBy,
      stixCoreObjectsTypes: this.state.stixCoreObjectsTypes,
      keyword: this.state.keyword,
    };
    this.setState(
      {
        selectedTimeRangeInterval: filterAdjust.selectedTimeRangeInterval,
        graphData: buildCorrelationData(
          this.graphObjects,
          decodeGraphData(this.props.report.x_opencti_graph_data),
          this.props.t,
          filterAdjust,
        ),
      },
      () => this.saveParameters(false),
    );
  }

  handleSearch(keyword) {
    const filterAdjust = {
      selectedTimeRangeInterval: this.state.selectedTimeRangeInterval,
      markedBy: this.state.markedBy,
      createdBy: this.state.createdBy,
      stixCoreObjectsTypes: this.state.stixCoreObjectsTypes,
      keyword,
    };
    this.setState(
      {
        selectedTimeRangeInterval: filterAdjust.selectedTimeRangeInterval,
        graphData: buildCorrelationData(
          this.graphObjects,
          decodeGraphData(this.props.report.x_opencti_graph_data),
          this.props.t,
          filterAdjust,
        ),
      },
      () => this.saveParameters(false),
    );
  }

  render() {
    const { report, theme, t } = this.props;
    const {
      mode3D,
      modeFixed,
      modeTree,
      stixCoreObjectsTypes: currentStixCoreObjectsTypes,
      markedBy: currentMarkedBy,
      createdBy: currentCreatedBy,
      graphData,
      numberOfSelectedNodes,
      numberOfSelectedLinks,
      displayTimeRange,
      selectedTimeRangeInterval,
      selectModeFree,
    } = this.state;
    const width = window.innerWidth - 210;
    const height = window.innerHeight - 180;
    const sortByLabel = R.sortBy(R.compose(R.toLower, R.prop('tlabel')));
    const stixCoreObjectsTypes = R.pipe(
      R.map((n) => R.assoc(
        'tlabel',
        t(
          `${n.node.relationship_type ? 'relation_' : 'entity_'}${
            n.node.entity_type
          }`,
        ),
        n,
      )),
      sortByLabel,
      R.map((n) => n.node.entity_type),
      R.filter((n) => n && n.length > 0),
      R.uniq,
    )(report.objects.edges);
    const markedBy = R.uniqBy(
      R.prop('id'),
      R.concat(
        R.pipe(
          R.filter((m) => m.node.objectMarking),
          R.map((m) => m.node.objectMarking.edges),
          R.flatten,
          R.map((m) => m.node),
        )(report.objects.edges),
        R.pipe(
          R.filter((m) => m.node.reports),
          R.map((m) => m.node.reports.edges),
          R.flatten,
          R.map((m) => m.node.objectMarking.edges),
          R.flatten,
          R.map((m) => m.node),
        )(report.objects.edges),
      ),
    );
    const createdBy = R.uniqBy(
      R.prop('id'),
      R.concat(
        R.pipe(
          R.filter((m) => m.node.createdBy),
          R.map((m) => m.node.createdBy),
          R.flatten,
          R.filter((m) => m.id),
        )(report.objects.edges),
        R.pipe(
          R.filter((m) => m && m.node.reports),
          R.map((m) => m.node.reports.edges),
          R.flatten,
          R.map((m) => m.node.createdBy),
          R.flatten,
          R.filter((m) => m && m.id),
        )(report.objects.edges),
      ),
    );
    const timeRangeNodes = R.uniqBy(
      R.prop('id'),
      R.pipe(
        R.filter((n) => n.node.reports),
        R.map((n) => n.node.reports.edges),
        R.flatten,
        R.map((n) => n.node),
      )(report.objects.edges),
    );
    const timeRangeInterval = computeTimeRangeInterval(timeRangeNodes);
    const timeRangeValues = computeTimeRangeValues(
      timeRangeInterval,
      timeRangeNodes,
    );
    return (
      <div>
        <ReportKnowledgeGraphBar
          handleToggle3DMode={this.handleToggle3DMode.bind(this)}
          currentMode3D={mode3D}
          handleToggleTreeMode={this.handleToggleTreeMode.bind(this)}
          currentModeTree={modeTree}
          handleToggleFixedMode={this.handleToggleFixedMode.bind(this)}
          currentModeFixed={modeFixed}
          handleZoomToFit={this.handleZoomToFit.bind(this)}
          handleToggleCreatedBy={this.handleToggleCreateBy.bind(this)}
          handleToggleStixCoreObjectType={this.handleToggleStixCoreObjectType.bind(
            this,
          )}
          handleToggleMarkedBy={this.handleToggleMarkedBy.bind(this)}
          handleToggleSelectModeFree={this.handleToggleSelectModeFree.bind(this)}
          stixCoreObjectsTypes={stixCoreObjectsTypes}
          currentStixCoreObjectsTypes={currentStixCoreObjectsTypes}
          currentSelectModeFree={selectModeFree}
          markedBy={markedBy}
          currentMarkedBy={currentMarkedBy}
          createdBy={createdBy}
          currentCreatedBy={currentCreatedBy}
          handleSelectAll={this.handleSelectAll.bind(this)}
          handleSelectByType={this.handleSelectByType.bind(this)}
          report={report}
          onAdd={false}
          onDelete={false}
          onAddRelation={false}
          handleDeleteSelected={false}
          selectedNodes={Array.from(this.selectedNodes)}
          selectedLinks={Array.from(this.selectedLinks)}
          numberOfSelectedNodes={numberOfSelectedNodes}
          numberOfSelectedLinks={numberOfSelectedLinks}
          handleCloseEntityEdition={this.handleCloseEntityEdition.bind(this)}
          handleCloseRelationEdition={this.handleCloseRelationEdition.bind(
            this,
          )}
          handleResetLayout={this.handleResetLayout.bind(this)}
          displayTimeRange={displayTimeRange}
          handleToggleDisplayTimeRange={this.handleToggleDisplayTimeRange.bind(
            this,
          )}
          timeRangeInterval={timeRangeInterval}
          selectedTimeRangeInterval={selectedTimeRangeInterval}
          handleTimeRangeChange={this.handleTimeRangeChange.bind(this)}
          timeRangeValues={timeRangeValues}
          handleSearch={this.handleSearch.bind(this)}
        />
        {mode3D ? (
          <ForceGraph3D
            ref={this.graph}
            width={width}
            height={height}
            backgroundColor={theme.palette.background.default}
            graphData={graphData}
            nodeThreeObjectExtend={true}
            nodeThreeObject={(node) => nodeThreePaint(node, theme.palette.text.primary)
            }
            linkColor={(link) => (this.selectedLinks.has(link)
              ? theme.palette.secondary.main
              : theme.palette.primary.main)
            }
            linkWidth={0.2}
            linkDirectionalArrowLength={3}
            linkDirectionalArrowRelPos={0.99}
            linkThreeObjectExtend={true}
            linkThreeObject={(link) => {
              const sprite = new SpriteText(link.label);
              sprite.color = 'lightgrey';
              sprite.textHeight = 1.5;
              return sprite;
            }}
            linkPositionUpdate={(sprite, { start, end }) => {
              const middlePos = Object.assign(
                ...['x', 'y', 'z'].map((c) => ({
                  [c]: start[c] + (end[c] - start[c]) / 2,
                })),
              );
              Object.assign(sprite.position, middlePos);
            }}
            onNodeClick={this.handleNodeClick.bind(this)}
            onNodeRightClick={(node) => {
              // eslint-disable-next-line no-param-reassign
              node.fx = undefined;
              // eslint-disable-next-line no-param-reassign
              node.fy = undefined;
              // eslint-disable-next-line no-param-reassign
              node.fz = undefined;
              this.handleDragEnd();
              this.forceUpdate();
            }}
            onNodeDrag={(node, translate) => {
              if (this.selectedNodes.has(node)) {
                [...this.selectedNodes]
                  .filter((selNode) => selNode !== node)
                  // eslint-disable-next-line no-shadow
                  .forEach((selNode) => ['x', 'y', 'z'].forEach(
                    // eslint-disable-next-line no-param-reassign,no-return-assign
                    (coord) => (selNode[`f${coord}`] = selNode[coord] + translate[coord]),
                  ));
              }
            }}
            onNodeDragEnd={(node) => {
              if (this.selectedNodes.has(node)) {
                // finished moving a selected node
                [...this.selectedNodes]
                  .filter((selNode) => selNode !== node) // don't touch node being dragged
                  // eslint-disable-next-line no-shadow
                  .forEach((selNode) => {
                    ['x', 'y'].forEach(
                      // eslint-disable-next-line no-param-reassign,no-return-assign
                      (coord) => (selNode[`f${coord}`] = undefined),
                    );
                    // eslint-disable-next-line no-param-reassign
                    selNode.fx = selNode.x;
                    // eslint-disable-next-line no-param-reassign
                    selNode.fy = selNode.y;
                    // eslint-disable-next-line no-param-reassign
                    selNode.fz = selNode.z;
                  });
              }
              // eslint-disable-next-line no-param-reassign
              node.fx = node.x;
              // eslint-disable-next-line no-param-reassign
              node.fy = node.y;
              // eslint-disable-next-line no-param-reassign
              node.fz = node.z;
            }}
            onLinkClick={this.handleLinkClick.bind(this)}
            onBackgroundClick={this.handleBackgroundClick.bind(this)}
            cooldownTicks={modeFixed ? 0 : undefined}
            dagMode={
              // eslint-disable-next-line no-nested-ternary
              modeTree === 'horizontal'
                ? 'lr'
                : modeTree === 'vertical'
                  ? 'td'
                  : undefined
            }
          />
        ) : (
         <RectangleSelection
           onSelect={(e, coords) => { this.handleRectSelectMove(e, coords); }}
           onMouseUp={(e) => { this.handleRectSelectUp(e); }}
           style={{
             backgroundColor: 'rgba(0,0,255,0.4)',
             borderColor: 'orange',
           }}
           disabled={!selectModeFree}
          >
           <ForceGraph2D
             ref={this.graph}
             width={width}
             height={height}
             graphData={graphData}
             onZoom={this.onZoom.bind(this)}
             onZoomEnd={this.handleZoomEnd.bind(this)}
             nodeRelSize={4}
             enablePanInteraction={!selectModeFree}
             nodeCanvasObject={(
               node,
               ctx, //
             ) =>
               // eslint-disable-next-line implicit-arrow-linebreak
               nodePaint(
                 {
                   selected: theme.palette.secondary.main,
                   inferred: theme.palette.warning.main,
                 },
                 node,
                 node.color,
                 ctx,
                 this.selectedNodes.has(node),
               )
             }
             nodePointerAreaPaint={nodeAreaPaint}
             // linkDirectionalParticles={(link) => (this.selectedLinks.has(link) ? 20 : 0)}
             // linkDirectionalParticleWidth={1}
             // linkDirectionalParticleSpeed={() => 0.004}
             linkCanvasObjectMode={() => 'after'}
             linkCanvasObject={(
               link,
               ctx, //
             ) =>
               // eslint-disable-next-line implicit-arrow-linebreak
               linkPaint(link, ctx, theme.palette.text.primary)
             }
             linkColor={(link) => (this.selectedLinks.has(link)
               ? theme.palette.secondary.main
               : theme.palette.primary.main)
             }
             linkDirectionalArrowLength={3}
             linkDirectionalArrowRelPos={0.99}
             onNodeClick={this.handleNodeClick.bind(this)}
             onNodeRightClick={(node) => {
               // eslint-disable-next-line no-param-reassign
               node.fx = undefined;
               // eslint-disable-next-line no-param-reassign
               node.fy = undefined;
               this.handleDragEnd();
               this.forceUpdate();
             }}
             onNodeDrag={(node, translate) => {
               if (this.selectedNodes.has(node)) {
                 [...this.selectedNodes]
                   .filter((selNode) => selNode !== node)
                   // eslint-disable-next-line no-shadow
                   .forEach((selNode) => ['x', 'y'].forEach(
                     // eslint-disable-next-line no-param-reassign,no-return-assign
                     (coord) => (selNode[`f${coord}`] = selNode[coord] + translate[coord]),
                   ));
               }
             }}
             onNodeDragEnd={(node) => {
               if (this.selectedNodes.has(node)) {
                 // finished moving a selected node
                 [...this.selectedNodes]
                   .filter((selNode) => selNode !== node) // don't touch node being dragged
                   // eslint-disable-next-line no-shadow
                   .forEach((selNode) => {
                     ['x', 'y'].forEach(
                       // eslint-disable-next-line no-param-reassign,no-return-assign
                       (coord) => (selNode[`f${coord}`] = undefined),
                     );
                     // eslint-disable-next-line no-param-reassign
                     selNode.fx = selNode.x;
                     // eslint-disable-next-line no-param-reassign
                     selNode.fy = selNode.y;
                   });
               }
               // eslint-disable-next-line no-param-reassign
               node.fx = node.x;
               // eslint-disable-next-line no-param-reassign
               node.fy = node.y;
               this.handleDragEnd();
             }}
             onLinkClick={this.handleLinkClick.bind(this)}
             onBackgroundClick={this.handleBackgroundClick.bind(this)}
             cooldownTicks={modeFixed ? 0 : undefined}
             dagMode={
               // eslint-disable-next-line no-nested-ternary
               modeTree === 'horizontal'
                 ? 'lr'
                 : modeTree === 'vertical'
                   ? 'td'
                   : undefined
             }
           />
         </RectangleSelection>
        )}
      </div>
    );
  }
}

ReportKnowledgeCorrelationComponent.propTypes = {
  report: PropTypes.object,
  classes: PropTypes.object,
  theme: PropTypes.object,
  t: PropTypes.func,
};

const ReportKnowledgeCorrelation = createFragmentContainer(
  ReportKnowledgeCorrelationComponent,
  {
    report: graphql`
      fragment ReportKnowledgeCorrelation_report on Report {
        id
        name
        x_opencti_graph_data
        published
        confidence
        createdBy {
          ... on Identity {
            id
            name
            entity_type
          }
        }
        objectMarking {
          edges {
            node {
              id
              definition_type
              definition
              x_opencti_order
              x_opencti_color
            }
          }
        }
        objects {
          edges {
            node {
              ... on BasicObject {
                id
                entity_type
                parent_types
              }
              ... on StixCoreObject {
                created_at
                createdBy {
                  ... on Identity {
                    id
                    name
                    entity_type
                  }
                }
                objectMarking {
                  edges {
                    node {
                      id
                      definition_type
                      definition
                      x_opencti_order
                      x_opencti_color
                    }
                  }
                }
                reports {
                  edges {
                    node {
                      id
                      name
                      published
                      confidence
                      entity_type
                      parent_types
                      created_at
                      createdBy {
                        ... on Identity {
                          id
                          name
                          entity_type
                        }
                      }
                      objectMarking {
                        edges {
                          node {
                            id
                            definition_type
                            definition
                            x_opencti_order
                            x_opencti_color
                          }
                        }
                      }
                    }
                  }
                }
              }
              ... on StixDomainObject {
                created
              }
              ... on AttackPattern {
                name
                x_mitre_id
              }
              ... on Campaign {
                name
                first_seen
                last_seen
              }
              ... on CourseOfAction {
                name
              }
              ... on Individual {
                name
              }
              ... on Organization {
                name
              }
              ... on Sector {
                name
              }
              ... on System {
                name
              }
              ... on Indicator {
                name
                valid_from
              }
              ... on Infrastructure {
                name
              }
              ... on IntrusionSet {
                name
                first_seen
                last_seen
              }
              ... on Position {
                name
              }
              ... on City {
                name
              }
              ... on AdministrativeArea {
                name
              }
              ... on Country {
                name
              }
              ... on Region {
                name
              }
              ... on Malware {
                name
                first_seen
                last_seen
              }
              ... on ThreatActor {
                name
                first_seen
                last_seen
              }
              ... on Tool {
                name
              }
              ... on Vulnerability {
                name
              }
              ... on Incident {
                name
                first_seen
                last_seen
              }
              ... on StixCyberObservable {
                observable_value
                reports {
                  edges {
                    node {
                      id
                      name
                      published
                      confidence
                      entity_type
                      parent_types
                      created_at
                      createdBy {
                        ... on Identity {
                          id
                          name
                          entity_type
                        }
                      }
                      objectMarking {
                        edges {
                          node {
                            id
                            definition_type
                            definition
                            x_opencti_order
                            x_opencti_color
                          }
                        }
                      }
                    }
                  }
                }
              }
              ... on StixFile {
                observableName: name
              }
            }
          }
        }
      }
    `,
  },
);

export default R.compose(
  inject18n,
  withRouter,
  withTheme,
)(ReportKnowledgeCorrelation);
