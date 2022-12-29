import administrativeAreaTypeDefs from './administrativeArea.graphql';
import convertAdministrativeAreaToStix from './administrativeArea-converter';
import { NAME_FIELD, normalizeName } from '../../schema/identifier';
import administrativeAreaResolvers from './administrativeArea-resolver';
import { ENTITY_TYPE_LOCATION_ADMINISTRATIVE_AREA, StoreEntityAdministrativeArea } from './administrativeArea-types';
import type { ModuleDefinition } from '../../types/module';
import { registerDefinition } from '../../types/module';
import { REL_EXTENDED } from '../../database/stix';
import { RELATION_LOCATED_AT } from '../../schema/stixCoreRelationship';
import { ENTITY_TYPE_LOCATION_COUNTRY } from '../../schema/stixDomainObject';
import { ENTITY_TYPE_LOCATION } from '../../schema/general';

const ADMINISTRATIVE_AREA_DEFINITION: ModuleDefinition<StoreEntityAdministrativeArea> = {
  type: {
    id: 'administrativeAreas',
    name: ENTITY_TYPE_LOCATION_ADMINISTRATIVE_AREA,
    category: ENTITY_TYPE_LOCATION,
    aliased: true
  },
  graphql: {
    schema: administrativeAreaTypeDefs,
    resolver: administrativeAreaResolvers,
  },
  identifier: {
    definition: {
      [ENTITY_TYPE_LOCATION_ADMINISTRATIVE_AREA]: [{ src: NAME_FIELD }]
    },
    resolvers: {
      name(data: object) {
        return normalizeName(data);
      },
    },
  },
  attributes: [
    { name: 'name', type: 'string', multiple: false, upsert: true },
    { name: 'description', type: 'string', multiple: false, upsert: true },
  ],
  relations: [
    { name: RELATION_LOCATED_AT,
      targets: [
        { name: ENTITY_TYPE_LOCATION_COUNTRY, type: REL_EXTENDED },
      ] },
  ],
  converter: convertAdministrativeAreaToStix
};

registerDefinition(ADMINISTRATIVE_AREA_DEFINITION);
