import { FunctionComponent, useState } from "react";
import { NotesLinesPaginationQuery$variables } from "./__generated__/NotesLinesPaginationQuery.graphql";
import { Dialog, DialogContent, DialogTitle, IconButton, List, ListItem, ListItemIcon, ListItemText, Skeleton } from "@mui/material";
import { Add } from "@mui/icons-material";
import Drawer from "@components/common/drawer/Drawer";
import { useFormatter } from "src/components/i18n";
import SearchInput from "src/components/SearchInput";
import { styled } from "@mui/system";
import { FragmentRefs, RecordSourceSelectorProxy } from "relay-runtime";
import { QueryRenderer } from "src/relay/environment";
import AddNotesLines, { addNotesLinesQuery } from "./AddNotesLines";
import { AddNotesLinesQuery$data } from "./__generated__/AddNotesLinesQuery.graphql";
import { NoteCreationForm } from "./NoteCreation";
import { insertNode } from "src/utils/store";
import { StyledCreateButton } from "@components/common/menus/CreateEntityControlledDial";

const CreateButton = styled(IconButton)({
  float: 'right',
  marginTop: -15,
});

const StyledDrawerHeader = styled('div')({
  marginLeft: 'auto',
  marginRight: '20px',
});

interface AddNotesFunctionalComponentProps {
  stixCoreObjectOrStixCoreRelationshipId: string,
  stixCoreObjectOrStixCoreRelationshipNotes: readonly {
    readonly node: {
        readonly id: string;
        readonly objectMarking: readonly {
            readonly definition: string | null | undefined;
            readonly definition_type: string | null | undefined;
            readonly id: string;
            readonly x_opencti_color: string | null | undefined;
            readonly x_opencti_order: number;
        }[] | null | undefined;
        readonly " $fragmentSpreads": FragmentRefs<"StixCoreObjectOrStixCoreRelationshipNoteCard_node">;
    };
  }[],
  paginationOptions: NotesLinesPaginationQuery$variables,
}

// TODO: Rename to AddNotes and replace AddNotes.jsx
const AddNotesFunctionalComponent: FunctionComponent<AddNotesFunctionalComponentProps> = ({
  stixCoreObjectOrStixCoreRelationshipId,
  stixCoreObjectOrStixCoreRelationshipNotes,
  paginationOptions,
}) => {
  const { t_i18n } = useFormatter();
  const [open, setOpen] = useState<boolean>(false);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const updater = (store: RecordSourceSelectorProxy, key: string) => {
    return insertNode(store, 'Pagination_notes', { search }, key);
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSearch('');
  };

  const handleDialogOpen = () => {
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleSearch = (keyword: string) => {
    setSearch(keyword);
  };

  return (
    <>
      <CreateButton
        color="primary"
        aria-label="Add"
        onClick={handleOpen}
        size="large"
      >
        <Add fontSize="small" />
      </CreateButton>
      <Drawer
        open={open}
        onClose={handleClose}
        title={t_i18n("Add notes")}
        header={(
          <StyledDrawerHeader>
            <SearchInput
              variant="noAnimation"
              onSubmit={handleSearch}
            />
            <StyledCreateButton
              onClick={handleDialogOpen}
              color='primary'
              size='small'
              variant='contained'
            >
              {t_i18n('Create')} {t_i18n('Note')} <Add />
            </StyledCreateButton>
          </StyledDrawerHeader>
        )}
      >
        <QueryRenderer
          query={addNotesLinesQuery}
          variables={{
            search: search,
            count: 20,
          }}
          render={({ props }: { props: AddNotesLinesQuery$data }) => {
            if (props) {
              return (
                <AddNotesLines
                  stixCoreObjectOrStixCoreRelationshipId={
                    stixCoreObjectOrStixCoreRelationshipId
                  }
                  stixCoreObjectOrStixCoreRelationshipNotes={
                    stixCoreObjectOrStixCoreRelationshipNotes
                  }
                  data={props}
                  paginationOptions={paginationOptions}
                />
              );
            }
            return (
              <List>
                {Array.from(Array(20), (_, i) => (
                  <ListItem key={i} divider={true} button={false}>
                    <ListItemIcon>
                      <Skeleton
                        animation="wave"
                        variant="circular"
                        width={30}
                        height={30}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Skeleton
                          animation="wave"
                          variant="rectangular"
                          width="90%"
                          height={15}
                          style={{ marginBottom: 10 }}
                        />
                      }
                      secondary={
                        <Skeleton
                          animation="wave"
                          variant="rectangular"
                          width="90%"
                          height={15}
                        />
                      }
                    />
                  </ListItem>
                ))}
              </List>
            );
          }}
        />
      </Drawer>
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        PaperProps={{ elevation: 1 }}
      >
        <DialogTitle>{t_i18n('Create a note')}</DialogTitle>
        <DialogContent>
          <NoteCreationForm
            inputValue={search}
            updater={updater}
            onClose={handleDialogClose}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddNotesFunctionalComponent;