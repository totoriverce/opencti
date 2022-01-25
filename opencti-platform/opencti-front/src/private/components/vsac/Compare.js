/* refactor */
import React, { useState } from 'react';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import moment from 'moment';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import Chip from '@material-ui/core/Chip';

const Compare = (props) => {
  const [getAnalysises] = useState(props.location.state.analysises);
  const [getScatterPlotData] = useState(props.location.state.scatterPlotData);

  const scatter = [];

  return (
    <Grid container={true} spacing={3}>
      <Grid item={true} xs={4}>
        <Paper elevation={2} style={{ height: '98%', marginBottom: 20 }}>
          <List>
            { getAnalysises.map((analysis, i) => {
              const hex = Math.floor(Math.random() * 16777215).toString(16);
              const fillColor = `#${hex}`;
              scatter.push({
                name: analysis.scan.scan_name,
                data: getScatterPlotData[i],
                fill: fillColor,
              });

              return (
                  <ListItem
                    key={i}
                    button>
                    <ListItemText
                      id={analysis.scan.id}
                      primary={analysis.scan.scan_name}
                      secondary={
                        <React.Fragment>
                          <div style={{ marginBottom: 10 }}>
                            {moment(analysis.completed_date).fromNow()}
                          </div>
                          {analysis.weakness_range && (
                            <Chip
                              size="small"
                              style={{ margin: 3 }}
                              label={`Top  ${analysis.weakness_range}`}
                            />
                          )}
                          {analysis.vulnerability_range && (
                            <Chip
                              size="small"
                              style={{ margin: 3 }}
                              label={`Previous ${analysis.vulnerability_range} Years`}
                            />
                          )}
                          {analysis.vignette_name && (
                            <Chip
                              size="small"
                              style={{ margin: 3 }}
                              label={analysis.vignette_name}
                            />
                          )}
                        </React.Fragment>
                      }
                    />
                    <ListItemSecondaryAction>
                      <FiberManualRecordIcon style={{ color: fillColor }} />
                    </ListItemSecondaryAction>
                  </ListItem>
              );
            })}
          </List>
        </Paper>
      </Grid>
      <Grid item={true} xs={8}>
        <Paper elevation={2} style={{ marginBottom: 20, padding: 5 }}>
          <ResponsiveContainer width="100%" aspect={1}>
            <ScatterChart
              width={500}
              height={500}
              margin={{
                top: 0,
                right: 0,
                bottom: 20,
                left: 0,
              }}
            >
              <XAxis
                type="number"
                dataKey="x"
                label="% of Hosts with Weakness"
                domain={[-200, 200]}
                tick={{ fill: '#ffffff' }}
              />
              <YAxis
                type="number"
                dataKey="y"
                label={{
                  value: 'Weakness Score',
                  angle: -90,
                  position: 'insideLeft',
                  textAnchor: 'middle',
                }}
                domain={[-200, 200]}
                tick={{ fill: '#ffffff' }}
              />
              <ReferenceLine x={0} stroke="white" />
              <ReferenceLine y={0} stroke="white" />
              {scatter.map((plot, i) => (
                 <Scatter key={i} name={plot.name} data={plot.data} fill={plot.fill} />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Compare;
