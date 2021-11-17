import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import {
  Route, Redirect, withRouter, Switch,
} from 'react-router-dom';
import graphql from 'babel-plugin-relay/macro';
import { QueryRenderer as QR } from 'react-relay';
import QueryRendererDarkLight from '../../../../relay/environmentDarkLight';
import {
  QueryRenderer,
  requestSubscription,
} from '../../../../relay/environment';
import TopBar from '../../nav/TopBar';
import Network from './Network';
import NetworkKnowledge from './NetworkKnowledge';
import StixDomainObjectHeader from '../../common/stix_domain_objects/StixDomainObjectHeader';
import FileManager from '../../common/files/FileManager';
import NetworkPopover from './NetworkPopover';
import Loader from '../../../../components/Loader';
import StixCoreObjectHistory from '../../common/stix_core_objects/StixCoreObjectHistory';
import StixCoreObjectOrStixCoreRelationshipContainers from '../../common/containers/StixCoreObjectOrStixCoreRelationshipContainers';
import StixDomainObjectIndicators from '../../observations/indicators/StixDomainObjectIndicators';
import StixCoreRelationship from '../../common/stix_core_relationships/StixCoreRelationship';
import ErrorNotFound from '../../../../components/ErrorNotFound';
import StixCoreObjectKnowledgeBar from '../../common/stix_core_objects/StixCoreObjectKnowledgeBar';

const subscription = graphql`
  subscription RootNetworkSubscription($id: ID!) {
    stixDomainObject(id: $id) {
      ... on IntrusionSet {
        # ...Network_network
        ...NetworkEditionContainer_network
      }
      ...FileImportViewer_entity
      ...FileExportViewer_entity
      ...FileExternalReferencesViewer_entity
    }
  }
`;

// const networkQuery = graphql`
//   query RootNetworkQuery($id: String!) {
//     intrusionSet(id: $id) {
//       id
//       standard_id
//       name
//       aliases
//       x_opencti_graph_data
//       ...Network_network
//       ...NetworkKnowledge_network
//       ...FileImportViewer_entity
//       ...FileExportViewer_entity
//       ...FileExternalReferencesViewer_entity
//     }
//     connectorsForExport {
//       ...FileManager_connectorsExport
//     }
//   }
// `;

const networkQuery = graphql`
  query RootNetworkQuery($id: ID!) {
    networkAsset(id: $id) {
      id
      name
      ...Network_network
    }
  }
`;

class RootNetwork extends Component {
  constructor(props) {
    super(props);
    const {
      match: {
        params: { networkId },
      },
    } = props;
    this.sub = requestSubscription({
      subscription,
      variables: { id: networkId },
    });
  }

  componentWillUnmount() {
    this.sub.dispose();
  }

  render() {
    const {
      me,
      match: {
        params: { networkId },
      },
    } = this.props;
    const link = `/dashboard/assets/network/${networkId}/knowledge`;
    return (
      <div>
        <TopBar me={me || null} />
        <Route path="/dashboard/assets/network/:networkId/knowledge">
          <StixCoreObjectKnowledgeBar
            stixCoreObjectLink={link}
            availableSections={[
              'victimology',
              'attribution',
              'campaigns',
              'incidents',
              'malwares',
              'attack_patterns',
              'tools',
              'vulnerabilities',
              'observables',
              'infrastructures',
              'sightings',
              'observed_data',
            ]}
          />
        </Route>
        <QueryRenderer
          query={networkQuery}
          variables={{ id: networkId }}
          render={({ error, props }) => {
            if (props) {
              if (props.networkAsset) {
                return (
                  <Switch>
                    <Route
                      exact
                      path="/dashboard/assets/network/:networkId"
                      render={(routeProps) => (
                        <Network
                          {...routeProps}
                          network={props.networkAsset}
                        />
                      )}
                    />
                </Switch>
                );
              }
              return <ErrorNotFound />;
            }
            return <Loader />;
          }}
        />
      </div>
    );
  }
}

RootNetwork.propTypes = {
  children: PropTypes.node,
  match: PropTypes.object,
  me: PropTypes.object,
};

export default withRouter(RootNetwork);
