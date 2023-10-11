import React from 'react';
import { Field, Form, Formik } from 'formik';
import Button from '@mui/material/Button';
import * as R from 'ramda';
import { omit } from 'ramda';
import * as Yup from 'yup';
import { makeStyles } from '@mui/styles';
import { graphql } from 'react-relay';
import MenuItem from '@mui/material/MenuItem';
import Drawer from '../../common/drawer/Drawer';
import GroupField from '../../common/form/GroupField';
import { convertGrantableGroups } from '../organizations/SettingsOrganizationEdition';
import { useFormatter } from '../../../../components/i18n';
import { commitMutation } from '../../../../relay/environment';
import TextField from '../../../../components/TextField';
import MarkdownField from '../../../../components/MarkdownField';
import ObjectOrganizationField from '../../common/form/ObjectOrganizationField';
import PasswordPolicies from '../../common/form/PasswordPolicies';
import SelectField from '../../../../components/SelectField';
import DateTimePickerField from '../../../../components/DateTimePickerField';
import { fieldSpacingContainerStyle } from '../../../../utils/field';
import useAuth from '../../../../utils/hooks/useAuth';
import { insertNode } from '../../../../utils/store';

const useStyles = makeStyles((theme) => ({
  buttons: {
    marginTop: 20,
    textAlign: 'right',
  },
  button: {
    marginLeft: theme.spacing(2),
  },
}));

const userMutation = graphql`
  mutation SettingsOrganizationUserCreationMutation($input: UserAddInput!) {
    userAdd(input: $input) {
      id
      name
      user_email
      firstname
      external
      lastname
      otp_activated
      created_at
    }
  }
`;

const userValidation = (t) => Yup.object().shape({
  name: Yup.string().required(t('This field is required')),
  user_email: Yup.string()
    .required(t('This field is required'))
    .email(t('The value must be an email address')),
  firstname: Yup.string().nullable(),
  lastname: Yup.string().nullable(),
  description: Yup.string().nullable(),
  password: Yup.string().required(t('This field is required')),
  confirmation: Yup.string()
    .oneOf([Yup.ref('password'), null], t('The values do not match'))
    .required(t('This field is required')),
  groups: Yup.array().required(t('This field is required')),
});

const SettingsOrganizationUserCreation = ({ paginationOptions, open, handleClose, organization }) => {
  const { settings } = useAuth();
  const { t } = useFormatter();
  const classes = useStyles();
  const onReset = () => handleClose();

  const onSubmit = (values, { setSubmitting, resetForm }) => {
    const finalValues = R.pipe(
      omit(['confirmation']),
      R.assoc('objectOrganization', R.pluck('value', values.objectOrganization)),
      R.assoc('groups', R.pluck('value', values.groups)),
    )(values);
    commitMutation({
      mutation: userMutation,
      variables: {
        input: finalValues,
      },
      updater: (store) => {
        insertNode(store, 'Pagination_organization_members', paginationOptions, 'userAdd', organization.id);
      },
      setSubmitting,
      onCompleted: () => {
        setSubmitting(false);
        resetForm();
        handleClose();
      },
    });
  };

  return (
    <Drawer
      open={open}
      title={t('Create a user')}
      onClose={handleClose}
    >
      <Formik
        initialValues={{
          name: '',
          user_email: '',
          firstname: '',
          lastname: '',
          description: '',
          password: '',
          confirmation: '',
          objectOrganization: [{
            label: organization.name,
            value: organization.id,
          }],
          account_status: 'Active',
          account_lock_after_date: null,
        }}
        validationSchema={userValidation(t)}
        onSubmit={onSubmit}
        onReset={onReset}
      >
        {({ submitForm, handleReset, isSubmitting }) => (
          <Form>
            <Field
              component={TextField}
              name="name"
              label={t('Name')}
              fullWidth={true}
            />
            <Field
              component={TextField}
              variant="standard"
              name="user_email"
              label={t('Email address')}
              fullWidth={true}
              style={{ marginTop: 20 }}
            />
            <Field
              component={TextField}
              variant="standard"
              name="firstname"
              label={t('Firstname')}
              fullWidth={true}
              style={{ marginTop: 20 }}
            />
            <Field
              component={TextField}
              variant="standard"
              name="lastname"
              label={t('Lastname')}
              fullWidth={true}
              style={{ marginTop: 20 }}
            />
            <Field
              component={MarkdownField}
              name="description"
              label={t('Description')}
              fullWidth={true}
              multiline={true}
              rows={4}
              style={{ marginTop: 20 }}
            />
            <PasswordPolicies />
            <Field
              component={TextField}
              variant="standard"
              name="password"
              label={t('Password')}
              type="password"
              style={{ marginTop: 20 }}
              fullWidth={true}
            />
            <Field
              component={TextField}
              variant="standard"
              name="confirmation"
              label={t('Confirmation')}
              type="password"
              fullWidth={true}
              style={{ marginTop: 20 }}
            />
            <ObjectOrganizationField
              disabled
              outlined={false}
              name="objectOrganization"
              label="Organizations"
              style={fieldSpacingContainerStyle}
            />
            <GroupField
              name="groups"
              label={t('Add a group')}
              multiple={true}
              containerStyle={{ width: '100%' }}
              predefinedGroups={convertGrantableGroups(organization)}
              style={fieldSpacingContainerStyle}
            />
            <Field
              component={SelectField}
              variant="standard"
              name="account_status"
              label={t('Account Status')}
              fullWidth={true}
              containerstyle={fieldSpacingContainerStyle}
            >
              {settings.platform_user_statuses.map((s) => {
                return <MenuItem key={s.status} value={s.status}>{t(s.status)}</MenuItem>;
              })}
            </Field>
            <Field
              component={DateTimePickerField}
              name="account_lock_after_date"
              TextFieldProps={{
                label: t('Account Expire Date'),
                style: fieldSpacingContainerStyle,
                variant: 'standard',
                fullWidth: true,
              }}
            />
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
    </Drawer>
  );
};

export default SettingsOrganizationUserCreation;
