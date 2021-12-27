import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { compose } from 'ramda';
import { Link } from 'react-router-dom';
import { createFragmentContainer } from 'react-relay';
import graphql from 'babel-plugin-relay/macro';
import { withStyles } from '@material-ui/core/styles';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import Typography from '@material-ui/core/Typography';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import { MoreVert } from '@material-ui/icons';
import Skeleton from '@material-ui/lab/Skeleton';
import Button from '@material-ui/core/Button';
import Tooltip from '@material-ui/core/Tooltip';
import * as R from 'ramda';
import { AutoFix } from 'mdi-material-ui';
import inject18n from '../../../../../components/i18n';
import ItemConfidence from '../../../../../components/ItemConfidence';
import RemediationPopover from './RemediationPopover';
import { resolveLink } from '../../../../../utils/Entity';
import ItemIcon from '../../../../../components/ItemIcon';
import { defaultValue } from '../../../../../utils/Graph';
import Security, { KNOWLEDGE_KNUPDATE } from '../../../../../utils/Security';

const styles = (theme) => ({
  item: {
    paddingLeft: 10,
  },
  ListItem: {
    display: 'grid',
    gridTemplateColumns: '10% 15% 15% 1fr 1fr 15%',
  },
  itemIcon: {
    color: theme.palette.primary.main,
  },
  bodyItem: {
    float: 'left',
    height: '35px',
    display: 'flex',
    overflow: 'hidden',
    fontSize: '13px',
    alignItems: 'center',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    justifyContent: 'left',
  },
  itemIconDisabled: {
    color: theme.palette.grey[700],
  },
  placeholder: {
    display: 'inline-block',
    height: '1em',
    backgroundColor: theme.palette.grey[700],
  },
});

class RemediationEntityLineComponent extends Component {
  render() {
    const {
      fsd,
      t,
      fldt,
      classes,
      dataColumns,
      node,
      paginationOptions,
      displayRelation,
      entityId,
    } = this.props;
    const origins = R.pathOr([], ['origins'], node);
    console.log('remediationEntityLineData', origins);
    let restricted = false;
    let targetEntity = null;
    if (node.from && node.from.id === entityId) {
      targetEntity = node.to;
    } else if (node.to && node.to.id === entityId) {
      targetEntity = node.from;
    } else {
      restricted = true;
    }
    if (targetEntity === null) {
      restricted = true;
    }
    // eslint-disable-next-line no-nested-ternary
    // const link = !restricted
    //   ? targetEntity.parent_types.includes('stix-core-relationship')
    //     ? `/dashboard/observations/observables/${entityId}/knowledge/relations/${node.id}`
    //     : `${resolveLink(targetEntity.entity_type)}/${targetEntity.id
    //     }/knowledge/relations/${node.id}`
    //   : null;
    return (
      <ListItem
        classes={{ root: classes.item }}
        divider={true}
        button={true}
        component={Link}
        to={`/dashboard/risk-assessment/risks/${entityId}/remediation/${node.id}`}
      // disabled={restricted}
      >
        <ListItemText
          primary={
            <div className={classes.ListItem}>
              <div className={classes.bodyItem}>
                <Typography align="left">
                  {node.name && t(node.name)}
                </Typography>
              </div>
              <div className={classes.bodyItem}>
                <Button variant='outlined' size="small" color='primary'>
                  {node.response_type && t(node.response_type)}
                </Button>
              </div>
              <div className={classes.bodyItem}>
                <Button variant='outlined' size="small" color='secondary'>
                  {node.lifecycle && t(node.lifecycle)}
                </Button>
              </div>
              <div className={classes.bodyItem}>
                <Typography align="left">
                  {node.created && fldt(node.created)}
                </Typography>
              </div>
              <div className={classes.bodyItem}>
                <Typography align="left">
                  {node.modified && fldt(node.modified)}
                </Typography>
              </div>
              <div className={classes.bodyItem}>
                <Typography align="left">
                  {node.description && t(node.description)}
                </Typography>
              </div>
            </div>
          }
        />
        <ListItemSecondaryAction>
          {/* {node.is_inferred ? (
            <Tooltip
              title={
                t('Inferred knowledge based on the rule ')
                + R.head(node.x_opencti_inferences).rule.name
              }
            >
              <AutoFix fontSize="small" style={{ marginLeft: -30 }} />
            </Tooltip> */}
          {/* ) : ( */}
          {/*  <Security needs={[KNOWLEDGE_KNUPDATE]}> */}
          <RemediationPopover
            stixCoreRelationshipId={node.id}
            paginationOptions={paginationOptions}
          // disabled={restricted}
          />
          {/* </Security> */}
          {/* )} */}
        </ListItemSecondaryAction>
      </ListItem>
    );
  }
}

RemediationEntityLineComponent.propTypes = {
  paginationOptions: PropTypes.object,
  dataColumns: PropTypes.object,
  node: PropTypes.object,
  classes: PropTypes.object,
  t: PropTypes.func,
  fldt: PropTypes.func,
  fsd: PropTypes.func,
  displayRelation: PropTypes.bool,
  entityId: PropTypes.string,
};

const RemediationEntityLineFragment = createFragmentContainer(
  RemediationEntityLineComponent,
  {
    risk: graphql`
      fragment RemediationEntityLine_node on Risk {
        id
        name
        created
        modified
        remediations{
          id
          name            # Title
          description     # Description
          created         # Created
          modified        # Last Modified
          lifecycle       # Lifecycle
          response_type   # Response Type
          origins {
            id
            origin_actors {
              actor {
                ... on OscalPerson {
                  id
                  name
                }
              }
            }
          }
        }
      }
    `,
  },
);

export const RemediationEntityLine = compose(
  inject18n,
  withStyles(styles),
)(RemediationEntityLineFragment);

class RemediationEntityLineDummyComponent extends Component {
  render() {
    const { classes, dataColumns, displayRelation } = this.props;
    return (
      <ListItem classes={{ root: classes.item }} divider={true}>
        <ListItemIcon classes={{ root: classes.itemIconDisabled }}>
          <Skeleton animation="wave" variant="circle" width={30} height={30} />
        </ListItemIcon>
        <ListItemText
          primary={
            <div>
              {displayRelation && (
                <div
                  className={classes.bodyItem}
                  style={{ width: dataColumns.relationship_type.width }}
                >
                  <Skeleton
                    animation="wave"
                    variant="rect"
                    width="90%"
                    height="100%"
                  />
                </div>
              )}
              <div
                className={classes.bodyItem}
                style={{ width: dataColumns.entity_type.width }}
              >
                <Skeleton
                  animation="wave"
                  variant="rect"
                  width="90%"
                  height="100%"
                />
              </div>
              <div
                className={classes.bodyItem}
                style={{ width: dataColumns.name.width }}
              >
                <Skeleton
                  animation="wave"
                  variant="rect"
                  width="90%"
                  height="100%"
                />
              </div>
              <div
                className={classes.bodyItem}
                style={{ width: dataColumns.start_time.width }}
              >
                <Skeleton
                  animation="wave"
                  variant="rect"
                  width="90%"
                  height="100%"
                />
              </div>
              <div
                className={classes.bodyItem}
                style={{ width: dataColumns.stop_time.width }}
              >
                <Skeleton
                  animation="wave"
                  variant="rect"
                  width="90%"
                  height="100%"
                />
              </div>
              <div
                className={classes.bodyItem}
                style={{ width: dataColumns.confidence.width }}
              >
                <Skeleton
                  animation="wave"
                  variant="rect"
                  width={100}
                  height="100%"
                />
              </div>
            </div>
          }
        />
        <ListItemSecondaryAction classes={{ root: classes.itemIconDisabled }}>
          <MoreVert />
        </ListItemSecondaryAction>
      </ListItem>
    );
  }
}

RemediationEntityLineDummyComponent.propTypes = {
  dataColumns: PropTypes.object,
  classes: PropTypes.object,
  displayRelation: PropTypes.bool,
};

export const RemediationEntityLineDummy = compose(
  inject18n,
  withStyles(styles),
)(RemediationEntityLineDummyComponent);
