import type { AuthUser, AuthContext } from '../../types/user';
import { batchLoadThroughGetTo, createEntity } from '../../database/middleware';
import { notify } from '../../database/redis';
import { BUS_TOPICS } from '../../config/conf';
import { ABSTRACT_STIX_DOMAIN_OBJECT } from '../../schema/general';
import type { AdministrativeAreaAddInput, QueryAdministrativeAreasArgs } from '../../generated/graphql';
import { listEntitiesPaginated, storeLoadById } from '../../database/middleware-loader';
import { BasicStoreEntityAdministrativeArea, ENTITY_TYPE_LOCATION_ADMINISTRATIVE_AREA } from './administrativeArea-types';
import { RELATION_LOCATED_AT } from '../../schema/stixCoreRelationship';
import { ENTITY_TYPE_LOCATION_COUNTRY } from '../../schema/stixDomainObject';

export const findById = (context: AuthContext, user: AuthUser, administrativeAreaId: string): BasicStoreEntityAdministrativeArea => {
  return storeLoadById(context, user, administrativeAreaId, ENTITY_TYPE_LOCATION_ADMINISTRATIVE_AREA) as unknown as BasicStoreEntityAdministrativeArea;
};

export const findAll = (context: AuthContext, user: AuthUser, opts: QueryAdministrativeAreasArgs) => {
  return listEntitiesPaginated<BasicStoreEntityAdministrativeArea>(context, user, [ENTITY_TYPE_LOCATION_ADMINISTRATIVE_AREA], opts);
};

export const addAdministrativeArea = async (context: AuthContext, user: AuthUser, administrativeArea: AdministrativeAreaAddInput) => {
  const created = await createEntity(context, user, administrativeArea, ENTITY_TYPE_LOCATION_ADMINISTRATIVE_AREA);
  return notify(BUS_TOPICS[ABSTRACT_STIX_DOMAIN_OBJECT].ADDED_TOPIC, created, user);
};

export const batchCountry = async (context: AuthContext, user: AuthUser, administrativeAreaIds: Array<string>) => {
  return batchLoadThroughGetTo(context, user, administrativeAreaIds, RELATION_LOCATED_AT, ENTITY_TYPE_LOCATION_COUNTRY);
};
