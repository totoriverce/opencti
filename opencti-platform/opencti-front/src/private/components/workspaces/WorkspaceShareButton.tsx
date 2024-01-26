import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import ShareIcon from '@mui/icons-material/Share';
import Tooltip from '@mui/material/Tooltip';
import React, { Suspense, useEffect, useRef, useState } from 'react';
import Drawer from '@components/common/drawer/Drawer';
import Typography from '@mui/material/Typography';
import WorkspaceShareForm, { WorkspaceShareFormData } from '@components/workspaces/WorkspaceShareForm';
import WorkspaceShareList, { workspaceShareListQuery } from '@components/workspaces/WorkspaceShareList';
import { WorkspaceShareListQuery } from '@components/workspaces/__generated__/WorkspaceShareListQuery.graphql';
import { graphql, useMutation, useQueryLoader } from 'react-relay';
import { FormikConfig } from 'formik/dist/types';
import { useFormatter } from '../../../components/i18n';
import Loader, { LoaderVariant } from '../../../components/Loader';
import DeleteDialog from '../../../components/DeleteDialog';
import useDeletion from '../../../utils/hooks/useDeletion';

const workspaceShareButtonCreateMutation = graphql`
  mutation WorkspaceShareButtonCreateMutation($input: PublicDashboardAddInput!) {
    publicDashboardAdd(input: $input) {
      id
      uri_key
    }
  }
`;

const workspaceShareButtonDeleteMutation = graphql`
  mutation WorkspaceShareButtonDeleteMutation($id: ID!) {
    publicDashboardDelete(id: $id)
  }
`;

interface WorkspaceShareButtonProps {
  workspaceId: string
}

const WorkspaceShareButton = ({ workspaceId }: WorkspaceShareButtonProps) => {
  const { t_i18n } = useFormatter();

  const idToDelete = useRef<string>();
  const deletion = useDeletion({});

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [commitCreateMutation] = useMutation(workspaceShareButtonCreateMutation);
  const [commitDeleteMutation] = useMutation(workspaceShareButtonDeleteMutation);

  const [publicDashboardsQueryRef, fetchList] = useQueryLoader<WorkspaceShareListQuery>(workspaceShareListQuery);
  useEffect(() => {
    fetchList({});
  }, []);

  const onSubmit: FormikConfig<WorkspaceShareFormData>['onSubmit'] = (values, { setSubmitting }) => {
    commitCreateMutation({
      variables: {
        input: {
          name: values.name,
          dashboard_id: workspaceId,
          allowed_markings_ids: values.max_markings.map((marking) => marking.value),
        },
      },
      onCompleted: () => {
        setSubmitting(false);
        fetchList({}, { fetchPolicy: 'network-only' });
      },
    });
  };

  const confirmDelete = (id: string) => {
    idToDelete.current = id;
    deletion.handleOpenDelete();
  };

  const onDelete = () => {
    if (idToDelete.current) {
      deletion.setDeleting(true);
      commitDeleteMutation({
        variables: {
          id: idToDelete.current,
        },
        onCompleted: () => {
          deletion.setDeleting(false);
          deletion.handleCloseDelete();
          idToDelete.current = undefined;
          fetchList({}, { fetchPolicy: 'network-only' });
        },
      });
    }
  };

  return (
    <>
      <Tooltip title={t_i18n('Share as public dashboard')}>
        <ToggleButtonGroup size="small">
          <ToggleButton
            aria-label="Label"
            size="small"
            value="share-dashboard"
            onClick={() => setDrawerOpen(true)}
          >
            <ShareIcon fontSize="small" color="primary" />
          </ToggleButton>
        </ToggleButtonGroup>
      </Tooltip>

      <Drawer
        title={t_i18n('Public dashboard links')}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        containerStyle={{ minHeight: '100%' }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100%',
            padding: '20px 0',
          }}
        >
          <Typography
            variant="h4"
            gutterBottom={true}
          >
            {t_i18n('Existing links for this dashboard')}
          </Typography>

          {publicDashboardsQueryRef && (
            <Suspense fallback={<Loader variant={LoaderVariant.inElement} />}>
              <WorkspaceShareList
                queryRef={publicDashboardsQueryRef}
                onDelete={confirmDelete}
              />
            </Suspense>
          )}

          <section style={{ marginTop: 'auto' }}>
            <Typography
              variant="h4"
              gutterBottom={true}
              style={{ marginTop: '20px' }}
            >
              {t_i18n('Create a new link')}
            </Typography>

            <WorkspaceShareForm onSubmit={onSubmit} />
          </section>
        </div>
      </Drawer>

      <DeleteDialog
        title={t_i18n('Are you sure you want to delete this dashboard link?')}
        deletion={deletion}
        submitDelete={onDelete}
      />
    </>
  );
};

export default WorkspaceShareButton;
