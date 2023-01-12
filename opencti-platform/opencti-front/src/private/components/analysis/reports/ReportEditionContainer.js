import React from 'react';
import { createFragmentContainer, graphql } from 'react-relay';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { Close } from '@mui/icons-material';
import makeStyles from '@mui/styles/makeStyles';
import { useFormatter } from '../../../../components/i18n';
import { SubscriptionAvatars } from '../../../../components/Subscription';
import ReportEditionOverview from './ReportEditionOverview';

const useStyles = makeStyles((theme) => ({
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
  appBar: {
    width: '100%',
    zIndex: theme.zIndex.drawer + 1,
    borderBottom: '1px solid #5c5c5c',
  },
  title: {
    float: 'left',
  },
}));

const ReportEditionContainer = (props) => {
  const classes = useStyles();
  const { t } = useFormatter();

  const { handleClose, report, enableReferences } = props;
  const { editContext } = report;

  return (
    <div>
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
          {t('Update a report')}
        </Typography>
        <SubscriptionAvatars context={editContext} />
        <div className="clearfix" />
      </div>
      <div className={classes.container}>
        <ReportEditionOverview
          report={report}
          enableReferences={enableReferences}
          context={editContext}
          handleClose={handleClose}
        />
      </div>
    </div>
  );
};

const ReportEditionFragment = createFragmentContainer(ReportEditionContainer, {
  report: graphql`
    fragment ReportEditionContainer_report on Report {
      id
      ...ReportEditionOverview_report
      editContext {
        name
        focusOn
      }
    }
  `,
});

export default ReportEditionFragment;
