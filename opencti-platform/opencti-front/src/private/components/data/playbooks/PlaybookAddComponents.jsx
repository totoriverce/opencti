import React, { useState } from 'react';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { AddOutlined, CancelOutlined, Close } from '@mui/icons-material';
import makeStyles from '@mui/styles/makeStyles';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import * as R from 'ramda';
import { Field, Form, Formik } from 'formik';
import Button from '@mui/material/Button';
import * as Yup from 'yup';
import ListItemIcon from '@mui/material/ListItemIcon';
import Grid from '@mui/material/Grid';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Filters from '../../common/lists/Filters';
import FilterIconButton from '../../../../components/FilterIconButton';
import TextField from '../../../../components/TextField';
import SearchInput from '../../../../components/SearchInput';
import { useFormatter } from '../../../../components/i18n';
import { isUniqFilter } from '../../../../utils/filters/filtersUtils';
import ItemIcon from '../../../../components/ItemIcon';
import { isEmptyField, isNotEmptyField } from '../../../../utils/utils';
import SwitchField from '../../../../components/SwitchField';
import SelectField from '../../../../components/SelectField';

const useStyles = makeStyles((theme) => ({
  drawerPaper: {
    minHeight: '100vh',
    width: '50%',
    padding: 0,
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
  title: {
    float: 'left',
  },
  search: {
    float: 'right',
  },
  lines: {
    padding: 0,
    height: '100%',
    width: '100%',
  },
  buttons: {
    marginTop: 20,
    textAlign: 'right',
  },
  button: {
    marginLeft: theme.spacing(2),
  },
  config: {
    padding: '10px 20px 20px 20px',
  },
  container: {
    marginTop: 40,
  },
  step: {
    position: 'relative',
    width: '100%',
    margin: '0 0 20px 0',
    padding: 15,
    verticalAlign: 'middle',
    border: `1px solid ${theme.palette.background.accent}`,
    borderRadius: 5,
    display: 'flex',
  },
  formControl: {
    width: '100%',
  },
  buttonAdd: {
    width: '100%',
    height: 20,
  },
  stepCloseButton: {
    position: 'absolute',
    top: -20,
    right: -20,
  },
}));

const addComponentValidation = (t) => Yup.object().shape({
  name: Yup.string().required(t('This field is required')),
});

const PlaybookAddComponentsContent = ({
  searchTerm,
  action,
  selectedNode,
  playbookComponents,
  onConfigAdd,
  onConfigReplace,
  handleClose,
}) => {
  const classes = useStyles();
  const { t } = useFormatter();
  const currentConfig = selectedNode?.data?.configuration;
  const [filters, setFilters] = useState(
    currentConfig?.filters ? JSON.parse(currentConfig?.filters) : {},
  );
  const [actionsInputs, setActionsInputs] = useState([{}]);
  const [componentId, setComponentId] = useState(
    selectedNode?.data?.component?.id ?? null,
  );
  const handleAddFilter = (key, id, value) => {
    if (filters[key] && filters[key].length > 0) {
      setFilters({
        ...filters,
        [key]: isUniqFilter(key)
          ? [{ id, value }]
          : R.uniqBy(R.prop('id'), [{ id, value }, ...filters[key]]),
      });
    } else {
      setFilters({ ...filters, [key]: [{ id, value }] });
    }
  };
  const handleRemoveFilter = (key) => {
    setFilters(R.dissoc(key, filters));
  };
  const handleAddStep = () => {
    setActionsInputs(R.append({}, actionsInputs));
  };
  const handleRemoveStep = (i) => {
    const newActionsInputs = actionsInputs.splice(i, 1);
    setActionsInputs(newActionsInputs);
  };
  const handleChangeActionInput = (i, key, event) => {
    const { value } = event.target;
    actionsInputs[i] = R.assoc(key, value, actionsInputs[i] || {});
    setActionsInputs(actionsInputs);
  };
  const areStepValid = () => {
    for (const n of actionsInputs) {
      if (!n || !n.type || !n.field || !n.values || n.values.length === 0) {
        return false;
      }
    }
    return true;
  };
  const renderFieldOptions = (i) => {
    const disabled = R.isNil(actionsInputs[i]?.type) || R.isEmpty(actionsInputs[i]?.type);
    let options = [];
    if (actionsInputs[i]?.type === 'ADD') {
      options = [
        { label: t('Marking definitions'), value: 'object-marking' },
        { label: t('Labels'), value: 'object-label' },
        { label: t('External references'), value: 'external-reference' },
      ];
    } else if (actionsInputs[i]?.type === 'REPLACE') {
      options = [
        { label: t('Marking definitions'), value: 'object-marking' },
        { label: t('Labels'), value: 'object-label' },
        { label: t('Author'), value: 'created-by' },
        { label: t('Score'), value: 'x_opencti_score' },
        { label: t('Confidence'), value: 'confidence' },
        { label: t('Description'), value: 'description' },
      ];
      if (this.props.type) {
        options.push({ label: t('Status'), value: 'x_opencti_workflow_id' });
      }
    } else if (actionsInputs[i]?.type === 'REMOVE') {
      options = [
        { label: t('Marking definitions'), value: 'object-marking' },
        { label: t('Labels'), value: 'object-label' },
        { label: t('External references'), value: 'external-reference' },
      ];
    }
    return (
      <Select
        variant="standard"
        disabled={disabled}
        value={actionsInputs[i]?.type}
        onChange={(event) => handleChangeActionInput(i, 'field', event)}
      >
        {options.length > 0 ? (
          R.map(
            (n) => (
              <MenuItem key={n.value} value={n.value}>
                {n.label}
              </MenuItem>
            ),
            options,
          )
        ) : (
          <MenuItem value="none">{t('None')}</MenuItem>
        )}
      </Select>
    );
  };
  const onSubmit = (values, { resetForm }) => {
    const selectedComponent = playbookComponents
      .filter((n) => n.id === componentId)
      .at(0);
    const configurationSchema = JSON.parse(
      selectedComponent.configuration_schema,
    );
    const { name, ...config } = values;
    let finalConfig = config;
    if (configurationSchema?.properties?.filters) {
      const jsonFilters = JSON.stringify(filters);
      finalConfig = { ...config, filters: jsonFilters };
    }
    resetForm();
    if (selectedNode?.data?.component?.id && action === 'config') {
      onConfigReplace(selectedComponent, name, finalConfig);
    } else {
      onConfigAdd(selectedComponent, name, finalConfig);
    }
  };
  const renderLines = () => {
    const filterByKeyword = (n) => searchTerm === ''
      || n.name.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1
      || n.description.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1;
    const components = R.pipe(
      R.filter(
        (n) => n.is_entry_point
          === (selectedNode?.data?.component?.is_entry_point ?? false),
      ),
      R.filter(filterByKeyword),
    )(playbookComponents);
    return (
      <div className={classes.lines}>
        <List>
          {components.map((component) => {
            return (
              <ListItem
                key={component.id}
                divider={true}
                button={true}
                clases={{ root: classes.item }}
                onClick={() => setComponentId(component.id)}
              >
                <ListItemIcon>
                  <ItemIcon type={component.icon} />
                </ListItemIcon>
                <ListItemText
                  primary={component.name}
                  secondary={component.description}
                />
              </ListItem>
            );
          })}
        </List>
      </div>
    );
  };
  const renderConfig = () => {
    const selectedComponent = playbookComponents.filter((n) => n.id === componentId).at(0);
    const configurationSchema = JSON.parse(selectedComponent.configuration_schema ?? '{}');
    const defaultConfig = {};
    Object.entries(configurationSchema?.properties ?? {}).forEach(([k, v]) => {
      if (isNotEmptyField(v.default)) {
        defaultConfig[k] = v.default;
      }
    });
    return (
      <div className={classes.config}>
        <Formik
          initialValues={
            currentConfig
              ? {
                name:
                    selectedNode?.data?.component?.id === selectedComponent.id
                      ? selectedNode?.data?.name
                      : selectedComponent.name,
                ...currentConfig,
              }
              : {
                name: selectedComponent.name,
                ...defaultConfig,
              }
          }
          validationSchema={addComponentValidation(t)}
          onSubmit={onSubmit}
          onReset={handleClose}
        >
          {({ submitForm, handleReset, isSubmitting }) => (
            <Form style={{ margin: '20px 0 20px 0' }}>
              <Field
                component={TextField}
                variant="standard"
                name="name"
                label={t('Name')}
                fullWidth={true}
              />
              {Object.entries(configurationSchema?.properties ?? {}).map(
                ([k, v]) => {
                  if (k === 'filters') {
                    return (
                      <div key={k}>
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
                              'x_opencti_main_observable_type',
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
                          redirection
                        />
                        <div className="clearfix" />
                      </div>
                    );
                  }
                  if (k === 'actions') {
                    return (
                      <div key={k}>
                        <div
                          className={classes.container}
                          style={{ marginTop: 20 }}
                        >
                          {Array(actionsInputs.length)
                            .fill(0)
                            .map((_, i) => (
                              <div key={i} className={classes.step}>
                                <IconButton
                                  disabled={actionsInputs.length === 1}
                                  aria-label="Delete"
                                  className={classes.stepCloseButton}
                                  onClick={() => handleRemoveStep(i)}
                                  size="small"
                                >
                                  <CancelOutlined fontSize="small" />
                                </IconButton>
                                <Grid container={true} spacing={3}>
                                  <Grid item={true} xs={3}>
                                    <FormControl
                                      className={classes.formControl}
                                    >
                                      <InputLabel>
                                        {t('Action type')}
                                      </InputLabel>
                                      <Select
                                        variant="standard"
                                        value={actionsInputs[i]?.type}
                                        onChange={(event) => handleChangeActionInput(
                                          i,
                                          'type',
                                          event,
                                        )
                                        }
                                      >
                                        <MenuItem value="ADD">
                                          {t('Add')}
                                        </MenuItem>
                                        <MenuItem value="REPLACE">
                                          {t('Replace')}
                                        </MenuItem>
                                        <MenuItem value="REMOVE">
                                          {t('Remove')}
                                        </MenuItem>
                                      </Select>
                                    </FormControl>
                                  </Grid>
                                  <Grid item={true} xs={3}>
                                    <FormControl
                                      className={classes.formControl}
                                    >
                                      <InputLabel>{t('Field')}</InputLabel>
                                      {renderFieldOptions(i)}
                                    </FormControl>
                                  </Grid>
                                  <Grid item={true} xs={6}></Grid>
                                </Grid>
                              </div>
                            ))}
                          <div className={classes.add}>
                            <Button
                              disabled={!areStepValid()}
                              variant="contained"
                              color="secondary"
                              size="small"
                              onClick={handleAddStep}
                              classes={{ root: classes.buttonAdd }}
                            >
                              <AddOutlined fontSize="small" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  if (v.type === 'number') {
                    return (
                      <Field
                        component={TextField}
                        variant="standard"
                        type="number"
                        name={k}
                        label={t(k)}
                        fullWidth={true}
                      />
                    );
                  }
                  if (v.type === 'boolean') {
                    return (
                        <Field
                            component={SwitchField}
                            type="checkbox"
                            name={k}
                            label={t(k)}
                            containerstyle={{ marginTop: 20 }}
                        />
                    );
                  }
                  if (v.type === 'string' && isNotEmptyField(v.enum)) {
                    return (
                        <Field
                            component={SelectField}
                            variant="standard"
                            name={k}
                            label={t(k)}
                            fullWidth={true}
                            containerstyle={{ width: '100%' }}
                        >
                          {v.enum.map((value, i) => (
                              <MenuItem key={i} value={value}>
                                {value}
                              </MenuItem>
                          ))}
                        </Field>
                    );
                  }
                  return (
                    <Field
                      component={TextField}
                      variant="standard"
                      name={k}
                      label={t(k)}
                      fullWidth={true}
                    />
                  );
                },
              )}
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
                  {selectedNode?.data?.component?.id
                    ? t('Update')
                    : t('Create')}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    );
  };
  return (
    <>
      {isEmptyField(componentId) && renderLines()}
      {isNotEmptyField(componentId) && renderConfig()}
    </>
  );
};

const PlaybookAddComponents = ({
  action,
  setSelectedNode,
  setSelectedEdge,
  selectedNode,
  selectedEdge,
  playbookComponents,
  onConfigAdd,
  onConfigReplace,
}) => {
  const classes = useStyles();
  const { t } = useFormatter();
  const [searchTerm, setSearchTerm] = useState('');
  const handleClose = () => {
    setSearchTerm('');
    setSelectedNode(null);
    setSelectedEdge(null);
  };
  const open = (action === 'config' || action === 'add' || action === 'replace')
    && (selectedNode !== null || selectedEdge || null);
  return (
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
        <Typography variant="h6" classes={{ root: classes.title }}>
          {t('Add components')}
        </Typography>
        <div className={classes.search}>
          <SearchInput
            variant="inDrawer"
            placeholder={`${t('Search')}...`}
            onChange={setSearchTerm}
          />
        </div>
      </div>
      {(selectedNode || selectedEdge) && (
        <PlaybookAddComponentsContent
          searchTerm={searchTerm}
          playbookComponents={playbookComponents}
          action={action}
          selectedNode={selectedNode}
          onConfigAdd={onConfigAdd}
          onConfigReplace={onConfigReplace}
          handleClose={handleClose}
        />
      )}
    </Drawer>
  );
};

export default PlaybookAddComponents;
