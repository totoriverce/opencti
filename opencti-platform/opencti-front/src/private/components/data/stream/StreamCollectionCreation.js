import React, { useState } from 'react';
import * as PropTypes from 'prop-types';
import { Field, Form, Formik } from 'formik';
import withStyles from '@mui/styles/withStyles';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Fab from '@mui/material/Fab';
import { Add, Close } from '@mui/icons-material';
import * as Yup from 'yup';
import { graphql } from 'react-relay';
import { ConnectionHandler } from 'relay-runtime';
import * as R from 'ramda';
import { evolve, pluck } from 'ramda';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import inject18n from '../../../../components/i18n';
import { commitMutation } from '../../../../relay/environment';
import TextField from '../../../../components/TextField';
import Filters from '../../common/lists/Filters';
import GroupField from '../../common/form/GroupField';
import { isUniqFilter } from '../../../../utils/filters/filtersUtils';
import FilterIconButton from '../../../../components/FilterIconButton';

const styles = (theme) => ({
  drawerPaper: {
    minHeight: '100vh',
    width: '50%',
    position: 'fixed',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    padding: 0,
  },
  createButton: {
    position: 'fixed',
    bottom: 30,
    right: 230,
  },
  buttons: {
    marginTop: 20,
    textAlign: 'right',
  },
  button: {
    marginLeft: theme.spacing(2),
  },
  header: {
    backgroundColor: theme.palette.background.nav,
    padding: '20px 20px 20px 60px',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    left: 5,
    color: 'inherit',
  },
  importButton: {
    position: 'absolute',
    top: 15,
    right: 20,
  },
  container: {
    padding: '10px 20px 20px 20px',
  },
  title: {
    float: 'left',
  },
});

const StreamCollectionCreationMutation = graphql`
  mutation StreamCollectionCreationMutation($input: StreamCollectionAddInput!) {
    streamCollectionAdd(input: $input) {
      ...StreamLine_node
    }
  }
`;

const streamCollectionCreationValidation = (t) => Yup.object().shape({
  name: Yup.string().required(t('This field is required')),
  description: Yup.string().nullable(),
  stream_public: Yup.bool().nullable(),
});

const sharedUpdater = (store, userId, paginationOptions, newEdge) => {
  const userProxy = store.get(userId);
  const conn = ConnectionHandler.getConnection(
    userProxy,
    'Pagination_streamCollections',
    paginationOptions,
  );
  ConnectionHandler.insertEdgeBefore(conn, newEdge);
};

const StreamCollectionCreation = (props) => {
  const { t, classes } = props;
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState({});

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setFilters({});
    setOpen(false);
  };

  const onSubmit = (values, { setSubmitting, resetForm }) => {
    const adaptedValues = evolve({ groups: pluck('value') }, values);
    const jsonFilters = JSON.stringify(filters);
    commitMutation({
      mutation: StreamCollectionCreationMutation,
      variables: {
        input: { ...adaptedValues, filters: jsonFilters },
      },
      updater: (store) => {
        const payload = store.getRootField('streamCollectionAdd');
        const newEdge = payload.setLinkedRecord(payload, 'node');
        const container = store.getRoot();
        sharedUpdater(
          store,
          container.getDataID(),
          props.paginationOptions,
          newEdge,
        );
      },
      setSubmitting,
      onCompleted: () => {
        setSubmitting(false);
        resetForm();
        handleClose();
      },
    });
  };

  const onReset = () => {
    handleClose();
  };

  const handleAddFilter = (key, id, value) => {
    if (filters[key] && filters[key].length > 0) {
      setFilters(
        {
          ...filters,
          [key]: isUniqFilter(key)
            ? [{ id, value }]
            : R.uniqBy(R.prop('id'), [{ id, value }, ...filters[key]]),
        },
      );
    } else {
      setFilters({ ...filters, [key]: [{ id, value }] });
    }
  };

  const handleRemoveFilter = (key) => {
    setFilters(R.dissoc(key, filters));
  };

  return (
    <div>
      <Fab
        onClick={handleOpen}
        color="secondary"
        aria-label="Add"
        className={classes.createButton}
      >
        <Add />
      </Fab>
      <Drawer
        open={open}
        anchor="right"
        elevation={1}
        sx={{ zIndex: 1202 }}
        classes={{ paper: classes.drawerPaper }}
        onClose={handleClose}
      >
        <div className={classes.header}>
          <IconButton
            aria-label="Close"
            className={classes.closeButton}
            onClick={handleClose}
            size="large"
            color="primary"
          >
            <Close fontSize="small" color="primary" />
          </IconButton>
          <Typography variant="h6">{t('Create a live stream')}</Typography>
        </div>
        <div className={classes.container}>
          <Formik
            initialValues={{
              name: '',
              description: '',
              groups: [],
              stream_public: false,
            }}
            validationSchema={streamCollectionCreationValidation(t)}
            onSubmit={onSubmit}
            onReset={onReset}
          >
            {({ submitForm, handleReset, isSubmitting, setFieldValue, values }) => (
              <Form style={{ margin: '20px 0 20px 0' }}>
                <Field
                  component={TextField}
                  variant="standard"
                  name="name"
                  label={t('Name')}
                  fullWidth={true}
                />
                <Field
                  component={TextField}
                  variant="standard"
                  name="description"
                  label={t('Description')}
                  fullWidth={true}
                  style={{ marginTop: 20 }}
                />
                <FormControlLabel
                  control={
                    <Switch />
                  }
                  style={{ marginTop: 20 }}
                  name='stream_public'
                  onChange={(_, checked) => setFieldValue('stream_public', checked)}
                  label={t('Public')}
                />
                {!values.stream_public && (<GroupField
                  name="groups"
                  helpertext={t('Let the field empty to grant all users')}
                  style={{ marginTop: 20, width: '100%' }}
                />)}
                <div style={{ marginTop: 35 }}>
                  <Filters
                    variant="text"
                    availableFilterKeys={[
                      'entity_type',
                      'x_opencti_workflow_id',
                      'assigneeTo',
                      'objectContains',
                      'markedBy',
                      'labelledBy',
                      'creator',
                      'createdBy',
                      'priority',
                      'severity',
                      'x_opencti_score',
                      'x_opencti_detection',
                      'revoked',
                      'confidence',
                      'indicator_types',
                      'pattern_type',
                      'fromId',
                      'toId',
                      'fromTypes',
                      'toTypes',
                    ]}
                    handleAddFilter={handleAddFilter}
                    noDirectFilters={true}
                  />
                </div>
                <div className="clearfix" />
                <FilterIconButton
                  filters={filters}
                  handleRemoveFilter={handleRemoveFilter}
                  classNameNumber={2}
                  styleNumber={2}
                />
                <div className="clearfix" />
                <div className={classes.buttons}>
                  <Button
                    variant="contained"
                    onClick={handleReset}
                    disabled={isSubmitting}
                    classes={{ root: classes.button }}
                  >
                    {t('Cancel')}
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={submitForm}
                    disabled={isSubmitting}
                    classes={{ root: classes.button }}
                  >
                    {t('Create')}
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </Drawer>
    </div>
  );
};

StreamCollectionCreation.propTypes = {
  paginationOptions: PropTypes.object,
  classes: PropTypes.object,
  theme: PropTypes.object,
  t: PropTypes.func,
};

export default R.compose(
  inject18n,
  withStyles(styles, { withTheme: true }),
)(StreamCollectionCreation);
