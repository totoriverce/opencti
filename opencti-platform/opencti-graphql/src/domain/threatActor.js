import { assoc, head, join, map, tail } from 'ramda';
import uuid from 'uuid/v4';
import {
  dayFormat,
  escapeString,
  executeWrite,
  graknNow,
  loadEntityById,
  monthFormat,
  prepareDate,
  yearFormat
} from '../database/grakn';
import { BUS_TOPICS } from '../config/conf';
import { elLoadById, elPaginate } from '../database/elasticSearch';
import { addCreatedByRef, addMarkingDefs } from './stixEntity';
import { notify } from '../database/redis';

export const findById = threatActorId => {
  return elLoadById(threatActorId);
};
export const findAll = args => {
  return elPaginate('stix_domain_entities', assoc('type', 'threat-actor', args));
};

export const addThreatActor = async (user, threatActor) => {
  const internalId = threatActor.internal_id_key ? escapeString(threatActor.internal_id_key) : uuid();
  await executeWrite(async wTx => {
    const stixId = threatActor.stix_id_key ? escapeString(threatActor.stix_id_key) : `threat-actor--${uuid()}`;
    const threatActorIterator = await wTx.tx.query(`insert $threatActor isa Threat-Actor,
    has internal_id_key "${internalId}",
    has entity_type "threat-actor",
    has stix_id_key "${stixId}",
    has stix_label "",
    ${
      threatActor.alias
        ? `${join(
            ' ',
            map(val => `has alias "${escapeString(val)}",`, tail(threatActor.alias))
          )} has alias "${escapeString(head(threatActor.alias))}",`
        : 'has alias "",'
    }
    has name "${escapeString(threatActor.name)}", 
    has description "${escapeString(threatActor.description)}",
    has goal "${escapeString(threatActor.goal)}",
    has sophistication "${escapeString(threatActor.sophistication)}",
    has resource_level "${escapeString(threatActor.resource_level)}",
    has primary_motivation "${escapeString(threatActor.primary_motivation)}",
    has secondary_motivation "${escapeString(threatActor.secondary_motivation)}",
    has personal_motivation "${escapeString(threatActor.personal_motivation)}",
    has created ${threatActor.created ? prepareDate(threatActor.created) : graknNow()},
    has modified ${threatActor.modified ? prepareDate(threatActor.modified) : graknNow()},
    has revoked false,
    has created_at ${graknNow()},
    has created_at_day "${dayFormat(graknNow())}",
    has created_at_month "${monthFormat(graknNow())}",
    has created_at_year "${yearFormat(graknNow())}",        
    has updated_at ${graknNow()};
  `);
    const txThreatActor = await threatActorIterator.next();
    return txThreatActor.map().get('threatActor').id;
    // Create associated relations
    // await linkCreatedByRef(wTx, createId, threatActor.createdByRef);
    // await linkMarkingDef(wTx, createId, threatActor.markingDefinitions);
    // return createId;
  });
  const created = await loadEntityById(internalId);
  await addCreatedByRef(internalId, threatActor.createdByRef);
  await addMarkingDefs(internalId, threatActor.markingDefinitions);
  return notify(BUS_TOPICS.StixDomainEntity.ADDED_TOPIC, created, user);
};
