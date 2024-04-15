import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { compose } from 'ramda';
import { graphql } from 'react-relay';
import { Button } from '@mui/material';
import { Create } from '@mui/icons-material';
import { commitMutation, QueryRenderer } from '../../../../relay/environment';
import inject18n from '../../../../components/i18n';
import ReportEditionContainer from './ReportEditionContainer';
import { reportEditionOverviewFocus } from './ReportEditionOverview';
import Loader from '../../../../components/Loader';

export const reportEditionQuery = graphql`
  query ReportEditionContainerQuery($id: String!) {
    report(id: $id) {
      ...ReportEditionContainer_report
    }
  }
`;

class ReportEdition extends Component {
  handleClose() {
    commitMutation({
      mutation: reportEditionOverviewFocus,
      variables: {
        id: this.props.reportId,
        input: { focusOn: '' },
      },
    });
  }

  render() {
    const { t, reportId } = this.props;
    return (
      <QueryRenderer
        query={reportEditionQuery}
        variables={{ id: reportId }}
        render={({ props }) => {
          if (props) {
            return (
              <ReportEditionContainer
                report={props.report}
                handleClose={this.handleClose.bind(this)}
                controlledDial={({ onOpen }) => (
                  <Button
                    style={{
                      marginLeft: '3px',
                      fontSize: 'small',
                    }}
                    variant='contained'
                    onClick={onOpen}
                    disableElevation
                    aria-label={t('Edit')}
                  >
                    {t('Edit')} <Create />
                  </Button>
                )}
              />
            );
          }
          return <Loader variant="inElement" />;
        }}
      />
    );
  }
}

ReportEdition.propTypes = {
  reportId: PropTypes.string,
  me: PropTypes.object,
  classes: PropTypes.object,
  theme: PropTypes.object,
  t: PropTypes.func,
};

export default compose(
  inject18n,
)(ReportEdition);
