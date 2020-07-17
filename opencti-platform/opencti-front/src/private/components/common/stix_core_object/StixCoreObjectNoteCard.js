import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { compose, pathOr, take } from 'ramda';
import { createFragmentContainer } from 'react-relay';
import Markdown from 'react-markdown';
import graphql from 'babel-plugin-relay/macro';
import { withStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import Avatar from '@material-ui/core/Avatar';
import { ClockOutline } from 'mdi-material-ui';
import inject18n from '../../../../components/i18n';
import ItemMarking from '../../../../components/ItemMarking';
import StixCoreObjectNotePopover from './StixCoreObjectNotePopover';

const styles = (theme) => ({
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
    backgroundColor: theme.palette.background.navLight,
  },
  avatar: {
    backgroundColor: theme.palette.primary.main,
  },
  avatarDisabled: {
    backgroundColor: theme.palette.grey[600],
  },
  icon: {
    margin: '10px 20px 0 0',
    fontSize: 40,
    color: '#242d30',
  },
  area: {
    width: '100%',
    height: '100%',
  },
  header: {
    height: 55,
    paddingBottom: 0,
    marginBottom: 0,
  },
  content: {
    width: '100%',
    paddingTop: 0,
  },
  description: {
    height: 70,
    overflow: 'hidden',
  },
});

class StixCoreObjectNoteCardComponent extends Component {
  render() {
    const {
      nsdt, classes, node, onUpdate,
    } = this.props;
    return (
      <Card classes={{ root: classes.card }} raised={false}>
        <CardHeader
          classes={{ root: classes.header }}
          avatar={
            <Avatar className={classes.avatar}>
              {node.createdBy.node.name.charAt(0)}
            </Avatar>
          }
          title={node.createdBy.node.name}
          subheader={
            <span>
              <ClockOutline
                fontSize="small"
                style={{ float: 'left', marginRight: 5 }}
              />
              <Typography variant="body2" style={{ paddingTop: 2 }}>
                {nsdt(node.created)}
              </Typography>
            </span>
          }
          action={
            <StixCoreObjectNotePopover
              noteId={node.id}
              onUpdate={onUpdate.bind(this)}
            />
          }
        />
        <CardContent className={classes.content} style={{ paddingBottom: 10 }}>
          <Typography
            variant="body2"
            noWrap={true}
            style={{ margin: '10px 0 10px 0', fontWeight: 500 }}
          >
            {node.name}
          </Typography>
          <Typography variant="body2" style={{ marginBottom: 20 }}>
            <Markdown className="markdown" source={node.content} />
          </Typography>
          <div>
            {take(1, pathOr([], ['markingDefinitions', 'edges'], node)).map(
              (markingDefinition) => (
                <ItemMarking
                  key={markingDefinition.node.id}
                  label={markingDefinition.node.definition}
                  color={markingDefinition.node.x_opencti_color}
                />
              ),
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
}

StixCoreObjectNoteCardComponent.propTypes = {
  node: PropTypes.object,
  classes: PropTypes.object,
  t: PropTypes.func,
  nsdt: PropTypes.func,
  onUpdate: PropTypes.func,
};

const StixCoreObjectNoteCard = createFragmentContainer(
  StixCoreObjectNoteCardComponent,
  {
    node: graphql`
      fragment StixCoreObjectNoteCard_node on Note {
        id
        name
        description
        content
        created
        modified
        createdBy {
          node {
            id
            name
          }
        }
        labels {
          edges {
            node {
              id
              value
              color
            }
          }
        }
        markingDefinitions {
          edges {
            node {
              id
              definition
              x_opencti_color
            }
          }
        }
      }
    `,
  },
);

export default compose(inject18n, withStyles(styles))(StixCoreObjectNoteCard);
