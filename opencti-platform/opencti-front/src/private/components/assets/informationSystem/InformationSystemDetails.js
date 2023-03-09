import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { compose } from 'ramda';
import { createFragmentContainer } from 'react-relay';
import graphql from 'babel-plugin-relay/macro';
import { Formik, Form } from 'formik';
import { withStyles } from '@material-ui/core/styles';
import Tooltip from '@material-ui/core/Tooltip';
import Paper from '@material-ui/core/Paper';
import { Information } from 'mdi-material-ui';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import {
  Divider,
} from '@material-ui/core';
import inject18n from '../../../../components/i18n';
import RiskLevel from '../../common/form/RiskLevel';
import SystemDocumentation from './SystemDocumentation';
import SystemImplementation from './SystemImplementation';
import InformationTypesCreation from './InformationTypesCreation';

const styles = () => ({
  paper: {
    height: '100%',
    minHeight: '850px',
    margin: '10px 0 0 0',
    padding: '24px 24px 32px 24px',
    borderRadius: 6,
    maxHeight: '850px',
  },
  textBase: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 5,
  },
  impactContainer: {
    minWidth: '50px',
    display: 'flex',
    flexDirection: 'row',
  },
  impactTitle: {
    marginRight: '30px',
    minWidth: '30%',
  },
  impactContent: {
    minWidth: '10%',
  },
  impactText: {
    marginLeft: '10px',
  },
});

class InformationSystemDetailsComponent extends Component {
  renderSecurityImpact(type, impact) {
    const {
      t, classes,
    } = this.props;

    return (
      <div className={classes.impactContainer}>
        <div className={classes.impactTitle}>
          {type}
        </div>
        <div className={classes.impactContent}>
          {impact && (
            <RiskLevel
              risk={impact}
            />
          )}
          <span className={classes.impactText}>
            {impact && impact.includes('low') && t('Low')}
            {impact && impact.includes('moderate') && t('Moderate')}
            {impact && impact.includes('high') && t('High')}
          </span>
        </div>
      </div>
    );
  }

  render() {
    const {
      t, classes, informationSystem, refreshQuery,
    } = this.props;
    return (
      <Formik
        enableReinitialize={true}
      >
        {({
          setFieldValue,
        }) => (
          <Form>
            <div style={{ height: '100%' }}>
              <Typography variant="h4" gutterBottom={true}>
                {t('Details')}
              </Typography>
              <Paper classes={{ root: classes.paper }} elevation={2}>
                <Grid container={true} spacing={3}>
                  <Grid item={true} xs={12}>
                    <InformationTypesCreation
                      informationSystem={informationSystem}
                      renderSecurityImpact={this.renderSecurityImpact.bind(this)}
                    />
                  </Grid>
                  <Grid item={true} xs={6}>
                    <div className={classes.textBase}>
                      <Typography
                        variant="h3"
                        color="textSecondary"
                        gutterBottom={true}
                        style={{ margin: 0 }}
                      >
                        {t('Security Sensitivity Level')}
                      </Typography>
                      <Tooltip title={t('Identifies the overall information system sensitivity categorization, such as defined by FIPS-199.')}>
                        <Information
                          style={{ marginLeft: '5px' }}
                          fontSize="inherit"
                          color="disabled"
                        />
                      </Tooltip>
                    </div>
                    <div className="clearfix" />
                    {informationSystem?.security_sensitivity_level && <RiskLevel
                      risk={informationSystem?.security_sensitivity_level}
                    />}
                    <span style={{ marginLeft: '10px' }}>
                      {informationSystem?.security_sensitivity_level.includes('low') && t('Low')}
                      {informationSystem?.security_sensitivity_level.includes('moderate') && t('Moderate')}
                      {informationSystem?.security_sensitivity_level.includes('high') && t('High')}
                    </span>
                  </Grid>
                  <Grid item={true} xs={6}>
                    <div className={classes.textBase}>
                      <Typography
                        variant="h3"
                        color="textSecondary"
                        gutterBottom={true}
                        style={{ margin: 0 }}
                      >
                        {t('Security Impact Level')}
                      </Typography>
                      <Tooltip title={t('Identifies the overall level of expected impact resulting from loss of access to information, based on the sensitivity of information within the system.')}>
                        <Information
                          style={{ marginLeft: '5px' }}
                          fontSize="inherit"
                          color="disabled"
                        />
                      </Tooltip>
                    </div>
                    <div className="clearfix" />
                    <div>
                      {this.renderSecurityImpact('Confidentiality', informationSystem?.security_objective_confidentiality)}
                      {this.renderSecurityImpact('Integrity', informationSystem?.security_objective_integrity)}
                      {this.renderSecurityImpact('Availability', informationSystem?.security_objective_availability)}
                    </div>
                  </Grid>
                  <Grid item={true} xs={12}>
                    <Divider />
                  </Grid>
                  <SystemImplementation
                    refreshQuery={refreshQuery}
                    informationSystem={informationSystem}
                  />
                  <Grid item={true} xs={12}>
                    <Divider />
                  </Grid>
                  <SystemDocumentation
                    informationSystem={informationSystem}
                  />
                </Grid>
              </Paper>
            </div>
          </Form>
        )}
      </Formik>
    );
  }
}

InformationSystemDetailsComponent.propTypes = {
  t: PropTypes.func,
  fld: PropTypes.func,
  classes: PropTypes.object,
  refreshQuery: PropTypes.func,
  informationSystem: PropTypes.object,
};

const InformationSystemDetails = createFragmentContainer(InformationSystemDetailsComponent, {
  informationSystem: graphql`
    fragment InformationSystemDetails_information on InformationSystem {
      id
      security_sensitivity_level
      security_objective_integrity
      security_objective_availability
      security_objective_confidentiality
      ...SystemDocumentation_information
      ...SystemImplementation_information
      ...InformationTypesCreation_information
    }
  `,
});

export default compose(inject18n, withStyles(styles))(InformationSystemDetails);
