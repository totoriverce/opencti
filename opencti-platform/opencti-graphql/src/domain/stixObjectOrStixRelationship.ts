import { elLoadById } from '../database/engine';
import { READ_PLATFORM_INDICES, UPDATE_OPERATION_ADD, UPDATE_OPERATION_REMOVE } from '../database/utils';
import { internalLoadById, storeLoadById } from '../database/middleware-loader';
import { ABSTRACT_STIX_REF_RELATIONSHIP } from '../schema/general';
import { FunctionalError, UnsupportedError } from '../config/errors';
import { isStixRefRelationship } from '../schema/stixRefRelationship';
import { buildRelationData, patchAttribute } from '../database/middleware';
import { notify } from '../database/redis';
import { BUS_TOPICS } from '../config/conf';
import type { AuthContext, AuthUser } from '../types/user';
import type { StixRefRelationshipAddInput, StixRefRelationshipsAddInput } from '../generated/graphql';
import type { BasicStoreObject } from '../types/store';
import { schemaRelationsRefDefinition } from '../schema/schema-relationsRef';

type BusTopicsKeyType = keyof typeof BUS_TOPICS;

export const findById = async <T extends BasicStoreObject> (context: AuthContext, user: AuthUser, id: string) : Promise<T> => {
  return await elLoadById(context, user, id, { indices: READ_PLATFORM_INDICES }) as unknown as T;
};

const patchElementWithRefRelationships = async (
  context: AuthContext,
  user: AuthUser,
  stixObjectOrRelationshipId: string,
  type: string,
  relationship_type: string,
  targets: string[],
  operation: 'add' | 'remove',
  opts = {}
) => {
  const stixObjectOrRelationship = await internalLoadById(context, user, stixObjectOrRelationshipId, { type });
  const fieldName = schemaRelationsRefDefinition.convertDatabaseNameToInputName(stixObjectOrRelationship.entity_type, relationship_type);
  if (!fieldName) {
    throw UnsupportedError('This relationship type is not supported', { relationship_type });
  }
  const patch = { [fieldName]: targets };
  const operations = { [fieldName]: operation };
  const { element: patchedFrom } = await patchAttribute(context, user, stixObjectOrRelationshipId, type, patch, { ...opts, operations });
  return { ...stixObjectOrRelationship, ...patchedFrom }; // This concat is needed as rel_ must be kept in the result
};

export const stixObjectOrRelationshipAddRefRelation = async (
  context: AuthContext,
  user: AuthUser,
  stixObjectOrRelationshipId: string,
  input: StixRefRelationshipAddInput,
  type: string,
  opts = {}
): Promise<any> => { // TODO remove any when all resolvers in ts
  const to = await findById(context, user, input.toId);
  const patchedFrom = await patchElementWithRefRelationships(context, user, stixObjectOrRelationshipId, type, input.relationship_type, [input.toId], UPDATE_OPERATION_ADD, opts);
  const { element: refRelation } = await buildRelationData(context, user, { from: patchedFrom, to, relationship_type: input.relationship_type });
  await notify(BUS_TOPICS[type as BusTopicsKeyType].EDIT_TOPIC, refRelation, user);
  return refRelation as any;
};
export const stixObjectOrRelationshipAddRefRelations = async (
  context: AuthContext,
  user: AuthUser,
  stixObjectOrRelationshipId: string,
  input: StixRefRelationshipsAddInput,
  type: string,
  opts = {}
) => {
  return patchElementWithRefRelationships(context, user, stixObjectOrRelationshipId, type, input.relationship_type, input.toIds, UPDATE_OPERATION_ADD, opts);
};

export const stixObjectOrRelationshipDeleteRefRelation = async (
  context: AuthContext,
  user: AuthUser,
  stixObjectOrRelationshipId: string,
  toId: string,
  relationshipType: string,
  type: string,
  opts = {}
): Promise<any> => { // TODO remove any when all resolvers in ts
  const stixObjectOrRelationship = await storeLoadById(context, user, stixObjectOrRelationshipId, type);
  if (!stixObjectOrRelationship) {
    throw FunctionalError('Cannot delete the relation, Stix-Object or Stix-Relationship cannot be found.');
  }
  if (!isStixRefRelationship(relationshipType)) {
    throw FunctionalError(`Only ${ABSTRACT_STIX_REF_RELATIONSHIP} can be deleted through this method.`);
  }
  return patchElementWithRefRelationships(context, user, stixObjectOrRelationshipId, type, relationshipType, [toId], UPDATE_OPERATION_REMOVE, opts);
};
