import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import React, { CSSProperties, ReactNode } from 'react';
import makeStyles from '@mui/styles/makeStyles';

const useStyles = makeStyles({
  paper: {
    minHeight: 280,
    height: '100%',
    margin: '4px 0 0 0',
    padding: '0 0 10px 0',
    borderRadius: 6,
  },
});

interface WidgetContainerProps {
  children: ReactNode
  height?: CSSProperties['height']
  title: string
  variant: string
}

const WidgetContainer = ({
  children,
  height,
  title,
  variant,
}: WidgetContainerProps) => {
  const classes = useStyles();

  return (
    <div style={{ height: height || '100%' }}>
      <Typography
        variant="h4"
        gutterBottom={true}
        style={{
          margin: variant !== 'inLine' ? '0 0 10px 0' : '-10px 0 10px -7px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {title}
      </Typography>
      {variant !== 'inLine' ? (
        <Paper classes={{ root: classes.paper }} variant="outlined">
          {children}
        </Paper>
      ) : (
        children
      )}
    </div>
  );
};

export default WidgetContainer;