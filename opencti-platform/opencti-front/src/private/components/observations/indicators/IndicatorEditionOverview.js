import React from 'react';
import * as PropTypes from 'prop-types';
import { createFragmentContainer, graphql } from 'react-relay';
import { Field, Form, Formik } from 'formik';
import * as Yup from 'yup';
import * as R from 'ramda';
import TextField from '../../../../components/TextField';
import { SubscriptionFocus } from '../../../../components/Subscription';
import CreatedByField from '../../common/form/CreatedByField';
import ObjectMarkingField from '../../common/form/ObjectMarkingField';
import SwitchField from '../../../../components/SwitchField';
import MarkDownField from '../../../../components/MarkDownField';
import KillChainPhasesField from '../../common/form/KillChainPhasesField';
import ConfidenceField from '../../common/form/ConfidenceField';
import OpenVocabField from '../../common/form/OpenVocabField';
import { adaptFieldValue } from '../../../../utils/String';
import CommitMessage from '../../common/form/CommitMessage';
import {
  convertCreatedBy,
  convertKillChainPhases,
  convertMarkings,
  convertStatus,
} from '../../../../utils/edition';
import StatusField from '../../common/form/StatusField';
import { buildDate, parse } from '../../../../utils/Time';
import DateTimePickerField from '../../../../components/DateTimePickerField';
import { fieldSpacingContainerStyle } from '../../../../utils/field';
import { useFormatter } from '../../../../components/i18n';
import { useSchemaEditionValidation } from '../../../../utils/hooks/useEntitySettings';
import useFormEditor from '../../../../utils/hooks/useFormEditor';

const indicatorMutationFieldPatch = graphql`
  mutation IndicatorEditionOverviewFieldPatchMutation(
    $id: ID!
    $input: [EditInput]!
    $commitMessage: String
    $references: [String]
  ) {
    indicatorEdit(id: $id) {
      fieldPatch(
        input: $input
        commitMessage: $commitMessage
        references: $references
      ) {
        ...IndicatorEditionOverview_indicator
        ...Indicator_indicator
      }
    }
  }
`;

export const indicatorEditionOverviewFocus = graphql`
  mutation IndicatorEditionOverviewFocusMutation(
    $id: ID!
    $input: EditContext!
  ) {
    indicatorEdit(id: $id) {
      contextPatch(input: $input) {
        id
      }
    }
  }
`;

const indicatorMutationRelationAdd = graphql`
  mutation IndicatorEditionOverviewRelationAddMutation(
    $id: ID!
    $input: StixRefRelationshipAddInput!
  ) {
    indicatorEdit(id: $id) {
      relationAdd(input: $input) {
        from {
          ...IndicatorEditionOverview_indicator
        }
      }
    }
  }
`;

const indicatorMutationRelationDelete = graphql`
  mutation IndicatorEditionOverviewRelationDeleteMutation(
    $id: ID!
    $toId: StixRef!
    $relationship_type: String!
  ) {
    indicatorEdit(id: $id) {
      relationDelete(toId: $toId, relationship_type: $relationship_type) {
        ...IndicatorEditionOverview_indicator
      }
    }
  }
`;

const IndicatorEditionOverviewComponent = ({
  indicator,
  handleClose,
  context,
  enableReferences,
}) => {
  const { t } = useFormatter();

  const basicShape = {
    name: Yup.string().min(2).required(t('This field is required')),
    indicator_types: Yup.array(),
    confidence: Yup.number(),
    pattern: Yup.string().required(t('This field is required')),
    valid_from: Yup.date()
      .nullable()
      .typeError(t('The value must be a datetime (yyyy-MM-dd hh:mm (a|p)m)')),
    valid_until: Yup.date()
      .nullable()
      .min(
        Yup.ref('valid_from'),
        "The valid until date can't be before valid from date",
      )
      .typeError(t('The value must be a datetime (yyyy-MM-dd hh:mm (a|p)m)')),
    x_mitre_platforms: Yup.array().nullable(),
    x_opencti_score: Yup.number().nullable(),
    description: Yup.string().nullable(),
    x_opencti_detection: Yup.boolean(),
    references: Yup.array(),
    x_opencti_workflow_id: Yup.object(),
  };
  const indicatorValidator = useSchemaEditionValidation(
    'Indicator',
    basicShape,
  );

  const queries = {
    fieldPatch: indicatorMutationFieldPatch,
    relationAdd: indicatorMutationRelationAdd,
    relationDelete: indicatorMutationRelationDelete,
    editionFocus: indicatorEditionOverviewFocus,
  };
  const editor = useFormEditor(
    indicator,
    enableReferences,
    queries,
    indicatorValidator,
  );

  const onSubmit = (values, { setSubmitting }) => {
    const commitMessage = values.message;
    const references = R.pluck('value', values.references || []);
    const inputValues = R.pipe(
      R.dissoc('message'),
      R.dissoc('references'),
      R.assoc('x_opencti_workflow_id', values.x_opencti_workflow_id?.value),
      R.assoc('createdBy', values.createdBy?.value),
      R.assoc('x_mitre_platforms', values.x_mitre_platforms ?? []),
      R.assoc('indicator_types', values.indicator_types),
      R.assoc('objectMarking', R.pluck('value', values.objectMarking)),
      R.assoc('killChainPhases', R.pluck('value', values.killChainPhases)),
      R.assoc(
        'valid_from',
        values.valid_from ? parse(values.valid_from).format() : null,
      ),
      R.assoc(
        'valid_until',
        values.valid_from ? parse(values.valid_until).format() : null,
      ),
      R.toPairs,
      R.map((n) => ({ key: n[0], value: adaptFieldValue(n[1]) })),
    )(values);

    editor.fieldPatch({
      variables: {
        id: indicator.id,
        input: inputValues,
        commitMessage:
          commitMessage && commitMessage.length > 0 ? commitMessage : null,
        references,
      },
      setSubmitting,
      onCompleted: () => {
        setSubmitting(false);
        handleClose();
      },
    });
  };

  const handleSubmitField = (name, value) => {
    if (!enableReferences) {
      let finalValue = value;
      if (name === 'x_opencti_workflow_id') {
        finalValue = value.value;
      }
      editor.fieldPatch({
        variables: {
          id: indicator.id,
          input: {
            key: name,
            value: finalValue ?? '',
          },
        },
      });
    }
  };

  const initialValues = R.pipe(
    R.assoc('killChainPhases', convertKillChainPhases(indicator)),
    R.assoc('createdBy', convertCreatedBy(indicator)),
    R.assoc('objectMarking', convertMarkings(indicator)),
    R.assoc('x_opencti_workflow_id', convertStatus(t, indicator)),
    R.assoc('x_mitre_platforms', R.propOr([], 'x_mitre_platforms', indicator)),
    R.assoc('indicator_types', R.propOr([], 'indicator_types', indicator)),
    R.assoc('valid_from', buildDate(indicator.valid_from)),
    R.assoc('valid_until', buildDate(indicator.valid_until)),
    R.assoc('references', []),
    R.pick([
      'name',
      'references',
      'confidence',
      'pattern',
      'description',
      'valid_from',
      'valid_until',
      'x_opencti_score',
      'x_opencti_detection',
      'indicator_types',
      'x_mitre_platforms',
      'killChainPhases',
      'createdBy',
      'objectMarking',
      'x_opencti_workflow_id',
    ]),
  )(indicator);
  return (
    <Formik
      enableReinitialize={true}
      initialValues={initialValues}
      validationSchema={indicatorValidator}
      onSubmit={onSubmit}
    >
      {({
        submitForm,
        isSubmitting,
        setFieldValue,
        values,
        isValid,
        dirty,
      }) => (
        <Form style={{ margin: '20px 0 20px 0' }}>
          <Field
            component={TextField}
            variant="standard"
            name="name"
            label={t('Name')}
            fullWidth={true}
            onFocus={editor.changeFocus}
            onSubmit={handleSubmitField}
            helperText={
              <SubscriptionFocus context={context} fieldName="name" />
            }
          />
          <OpenVocabField
            label={t('Indicator types')}
            type="indicator-type-ov"
            name="indicator_types"
            onFocus={editor.changeFocus}
            onSubmit={handleSubmitField}
            onChange={(name, value) => setFieldValue(name, value)}
            containerStyle={fieldSpacingContainerStyle}
            variant="edit"
            multiple={true}
            editContext={context}
          />
          <ConfidenceField
            onFocus={editor.changeFocus}
            onSubmit={handleSubmitField}
            entityType="Indicator"
            containerStyle={fieldSpacingContainerStyle}
            editContext={context}
            variant="edit"
          />
          <Field
            component={TextField}
            variant="standard"
            name="pattern"
            label={t('Indicator pattern')}
            fullWidth={true}
            multiline={true}
            rows="4"
            style={{ marginTop: 20 }}
            onFocus={editor.changeFocus}
            onSubmit={handleSubmitField}
            helperText={
              <SubscriptionFocus context={context} fieldName="pattern" />
            }
          />
          <Field
            component={DateTimePickerField}
            name="valid_from"
            onFocus={editor.changeFocus}
            onSubmit={handleSubmitField}
            TextFieldProps={{
              label: t('Valid from'),
              variant: 'standard',
              fullWidth: true,
              style: { marginTop: 20 },
              helperText: (
                <SubscriptionFocus context={context} fieldName="valid_from" />
              ),
            }}
          />
          <Field
            component={DateTimePickerField}
            name="valid_until"
            onFocus={editor.changeFocus}
            onSubmit={handleSubmitField}
            TextFieldProps={{
              label: t('Valid until'),
              variant: 'standard',
              fullWidth: true,
              style: { marginTop: 20 },
              helperText: (
                <SubscriptionFocus context={context} fieldName="valid_until" />
              ),
            }}
          />
          <OpenVocabField
            label={t('Platforms')}
            type="platforms_ov"
            name="x_mitre_platforms"
            variant={'edit'}
            onSubmit={handleSubmitField}
            onChange={(name, value) => setFieldValue(name, value)}
            containerStyle={fieldSpacingContainerStyle}
            multiple={true}
            editContext={context}
          />
          <Field
            component={TextField}
            variant="standard"
            name="x_opencti_score"
            label={t('Score')}
            type="number"
            fullWidth={true}
            style={{ marginTop: 20 }}
            onFocus={editor.changeFocus}
            onSubmit={handleSubmitField}
            helperText={
              <SubscriptionFocus
                context={context}
                fieldName="x_opencti_score"
              />
            }
          />
          <Field
            component={MarkDownField}
            name="description"
            label={t('Description')}
            fullWidth={true}
            multiline={true}
            rows="4"
            style={{ marginTop: 20 }}
            onFocus={editor.changeFocus}
            onSubmit={handleSubmitField}
            helperText={
              <SubscriptionFocus context={context} fieldName="description" />
            }
          />
          <KillChainPhasesField
            name="killChainPhases"
            style={{ marginTop: 20, width: '100%' }}
            setFieldValue={setFieldValue}
            helpertext={
              <SubscriptionFocus
                context={context}
                fieldName="killChainPhases"
              />
            }
            onChange={editor.changeKillChainPhases}
          />
          {indicator.workflowEnabled && (
            <StatusField
              name="x_opencti_workflow_id"
              type="Indicator"
              onFocus={editor.changeFocus}
              onChange={handleSubmitField}
              setFieldValue={setFieldValue}
              style={{ marginTop: 20 }}
              helpertext={
                <SubscriptionFocus
                  context={context}
                  fieldName="x_opencti_workflow_id"
                />
              }
            />
          )}
          <CreatedByField
            name="createdBy"
            style={{ marginTop: 20, width: '100%' }}
            setFieldValue={setFieldValue}
            helpertext={
              <SubscriptionFocus context={context} fieldName="createdBy" />
            }
            onChange={editor.changeCreated}
          />
          <ObjectMarkingField
            name="objectMarking"
            style={{ marginTop: 20, width: '100%' }}
            helpertext={
              <SubscriptionFocus context={context} fieldname="objectMarking" />
            }
            onChange={editor.changeMarking}
          />
          <Field
            component={SwitchField}
            type="checkbox"
            name="x_opencti_detection"
            label={t('Detection')}
            containerstyle={{ marginTop: 20 }}
            onChange={handleSubmitField}
            helperText={
              <SubscriptionFocus
                context={context}
                fieldName="x_opencti_detection"
              />
            }
          />
          {enableReferences && (
            <CommitMessage
              submitForm={submitForm}
              disabled={isSubmitting || !isValid || !dirty}
              setFieldValue={setFieldValue}
              open={false}
              values={values.references}
              id={indicator.id}
            />
          )}
        </Form>
      )}
    </Formik>
  );
};

IndicatorEditionOverviewComponent.propTypes = {
  theme: PropTypes.object,
  t: PropTypes.func,
  indicator: PropTypes.object,
  context: PropTypes.array,
  enableReferences: PropTypes.bool,
};

const IndicatorEditionOverview = createFragmentContainer(
  IndicatorEditionOverviewComponent,
  {
    indicator: graphql`
      fragment IndicatorEditionOverview_indicator on Indicator {
        id
        name
        confidence
        description
        pattern
        valid_from
        valid_until
        revoked
        x_opencti_score
        x_opencti_detection
        x_mitre_platforms
        indicator_types
        createdBy {
          ... on Identity {
            id
            name
            entity_type
          }
        }
        killChainPhases {
          edges {
            node {
              id
              kill_chain_name
              phase_name
              x_opencti_order
            }
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
        status {
          id
          order
          template {
            name
            color
          }
        }
        workflowEnabled
      }
    `,
  },
);

export default IndicatorEditionOverview;
