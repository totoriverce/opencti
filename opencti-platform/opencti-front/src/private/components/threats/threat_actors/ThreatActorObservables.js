import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { compose } from 'ramda';
import { Route, withRouter } from 'react-router-dom';
import { createFragmentContainer } from 'react-relay';
import graphql from 'babel-plugin-relay/macro';
import { withStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import inject18n from '../../../../components/i18n';
import ThreatActorHeader from './ThreatActorHeader';
import StixRelation from '../../common/stix_relations/StixRelation';
import EntityStixObservables from '../../stix_observables/EntityStixObservables';

const styles = () => ({
  container: {
    margin: 0,
    padding: '0 260px 0 0',
  },
  containerWithoutPadding: {
    margin: 0,
    padding: 0,
  },
  paper: {
    minHeight: '100%',
    margin: '5px 0 0 0',
    padding: '15px',
    borderRadius: 6,
  },
});

class ThreatActorObservablesComponent extends Component {
  render() {
    const { classes, threatActor, location } = this.props;
    const link = `/dashboard/threats/threat_actors/${threatActor.id}/observables`;
    return (
      <div
        className={
          location.pathname.includes(
            `/dashboard/threats/threat_actors/${threatActor.id}/observables/relations/`,
          )
            ? classes.containerWithoutPadding
            : classes.container
        }
      >
        <ThreatActorHeader threatActor={threatActor} />
        <Route
          exact
          path="/dashboard/threats/threat_actors/:threatActorId/observables/relations/:relationId"
          render={routeProps => (
            <StixRelation
              entityId={threatActor.id}
              inversedRoles={[]}
              observable={true}
              {...routeProps}
            />
          )}
        />
        <Route
          exact
          path="/dashboard/threats/threat_actors/:threatActorId/observables"
          render={routeProps => (
            <Paper classes={{ root: classes.paper }} elevation={2}>
              <EntityStixObservables
                entityId={threatActor.id}
                relationType="indicates"
                entityLink={link}
                {...routeProps}
              />
            </Paper>
          )}
        />
      </div>
    );
  }
}

ThreatActorObservablesComponent.propTypes = {
  threatActor: PropTypes.object,
  location: PropTypes.object,
  classes: PropTypes.object,
  t: PropTypes.func,
};

const ThreatActorObservables = createFragmentContainer(
  ThreatActorObservablesComponent,
  {
    threatActor: graphql`
      fragment ThreatActorObservables_threatActor on ThreatActor {
        id
        ...ThreatActorHeader_threatActor
      }
    `,
  },
);

export default compose(
  inject18n,
  withRouter,
  withStyles(styles),
)(ThreatActorObservables);
