import * as R from 'ramda';
import { getEntitiesMapFromCache } from '../database/cache';
import { ENTITY_TYPE_MARKING_DEFINITION } from '../schema/stixMetaObject';
import { SYSTEM_USER } from './access';
import { UPDATE_OPERATION_ADD, UPDATE_OPERATION_REMOVE, UPDATE_OPERATION_REPLACE } from '../database/utils';

export const cleanMarkings = async (context, values) => {
  const markingsMap = await getEntitiesMapFromCache(context, SYSTEM_USER, ENTITY_TYPE_MARKING_DEFINITION);
  const defaultMarkingValues = values?.map((d) => markingsMap.get(d) ?? d) ?? [];
  const defaultGroupedMarkings = R.groupBy((m) => m.definition_type, defaultMarkingValues);
  return Object.entries(defaultGroupedMarkings).map(([_, key]) => {
    const max = Math.max(...key.map((m) => m.x_opencti_order));
    const results = key.filter((m) => m.x_opencti_order === max);
    return R.uniqWith((a, b) => a.id === b.id, results);
  }).flat();
};

// eslint-disable-next-line @typescript-eslint/default-param-last
export const handleMarkingOperations = async (context, currentMarkings = [], refs, operation) => {
  try {
    // Get all marking definitions
    const markingsMap = await getEntitiesMapFromCache(context, SYSTEM_USER, ENTITY_TYPE_MARKING_DEFINITION);
    // Get object entries from markings Map, convert into array without duplicate values
    const markingsAdded = [...new Set(Object.values(Object.fromEntries(markingsMap)))].filter((m) => refs.includes(m.id));
    // If multiple markings is added, filter and keep the highest rank
    const markingsAddedCleaned = await cleanMarkings(context, markingsAdded);

    const operationUpdated = { operation, refs };

    const markingsInCommon = currentMarkings.filter((item) => markingsAddedCleaned.some((m) => m.definition_type === item.definition_type));

    if (operation === UPDATE_OPERATION_ADD) {
      // If it is a new type, we add it
      if (markingsInCommon.length === 0) {
        // If markings in input is thoroughly different from current
        operationUpdated.operation = UPDATE_OPERATION_ADD;
        operationUpdated.refs = markingsAddedCleaned.map((m) => m.id);
        return operationUpdated;
      }

      // We have some type in common with different order
      if (markingsAddedCleaned.some((mark) => currentMarkings.some((mark2) => mark2.definition_type === mark.definition_type && mark2.x_opencti_order !== mark.x_opencti_order))) {
        const markingsToKeep = await cleanMarkings(context, [...currentMarkings, ...markingsAddedCleaned]);

        const markingsAddedHasHigherOrder = markingsToKeep
          .some((markingAdded) => currentMarkings
            .some((currentMarking) => currentMarking.definition_type && markingAdded.x_opencti_order && markingAdded.x_opencti_order > currentMarking.x_opencti_order));

        const markingsNotInCommon = markingsToKeep.filter((item) => !currentMarkings.some((m) => m.definition_type === item.definition_type));

        // If some of the added item has a higher rank than before, replace
        if (markingsAddedHasHigherOrder) {
          operationUpdated.operation = UPDATE_OPERATION_REPLACE;
          operationUpdated.refs = markingsToKeep.map((m) => m.id);
          return operationUpdated;
        } if (markingsNotInCommon.length !== 0) {
          // Add all markings to keep not in common with current if there is no highest order
          operationUpdated.operation = UPDATE_OPERATION_ADD;
          operationUpdated.refs = markingsNotInCommon.map((m) => m.id);
          return operationUpdated;
        } return null; // no marking to add, do nothing
      }
      // THIS IS A ADD
      operationUpdated.operation = UPDATE_OPERATION_ADD;
      operationUpdated.refs = markingsAddedCleaned.map((m) => m.id);
      return operationUpdated;
    }

    // If replace operation, replace all
    if (operation === UPDATE_OPERATION_REPLACE) {
      operationUpdated.operation = UPDATE_OPERATION_REPLACE;
      operationUpdated.refs = markingsAddedCleaned.map((m) => m.id);
      return operationUpdated;
    }

    // If remove operation, do nothing
    if (operation === UPDATE_OPERATION_REMOVE) {
      return operationUpdated;
    }

    // If add a new not expected operation, throw exception
    throw new Error('Invalid operation');
  } catch (error) {
    return error.message;
  }
};
