import type { JSONSchemaType } from 'ajv';
import threatActorIndividualTypeDefs from './threatActorIndividual.graphql';
import { ENTITY_TYPE_THREAT_ACTOR } from '../../schema/general';
import { INNER_TYPE, NAME_FIELD, normalizeName } from '../../schema/identifier';
import { type ModuleDefinition, registerDefinition } from '../../schema/module';
import { bornIn, ethnicity, objectOrganization } from '../../schema/stixRefRelationship';
import type { StixThreatActorIndividual, StoreEntityThreatActorIndividual } from './threatActorIndividual-types';
import { ENTITY_TYPE_THREAT_ACTOR_INDIVIDUAL } from './threatActorIndividual-types';
import threatActorIndividualResolvers from './threatActorIndividual-resolvers';
import convertThreatActorIndividualToStix from './threatActorIndividual-converter';
import {
  RELATION_ATTRIBUTED_TO,
  RELATION_COMPROMISES,
  RELATION_COOPERATES_WITH,
  RELATION_EMPLOYED_BY,
  RELATION_RESIDES_IN,
  RELATION_CITIZEN_OF,
  RELATION_NATIONAL_OF,
  RELATION_HOSTS,
  RELATION_IMPERSONATES,
  RELATION_LOCATED_AT,
  RELATION_OWNS,
  RELATION_PART_OF,
  RELATION_PARTICIPATES_IN,
  RELATION_TARGETS,
  RELATION_USES
} from '../../schema/stixCoreRelationship';
import {
  ENTITY_TYPE_ATTACK_PATTERN,
  ENTITY_TYPE_CAMPAIGN,
  ENTITY_TYPE_IDENTITY_INDIVIDUAL,
  ENTITY_TYPE_IDENTITY_SECTOR,
  ENTITY_TYPE_IDENTITY_SYSTEM,
  ENTITY_TYPE_INFRASTRUCTURE,
  ENTITY_TYPE_LOCATION_CITY,
  ENTITY_TYPE_LOCATION_COUNTRY,
  ENTITY_TYPE_LOCATION_POSITION,
  ENTITY_TYPE_LOCATION_REGION,
  ENTITY_TYPE_MALWARE,
  ENTITY_TYPE_THREAT_ACTOR_GROUP,
  ENTITY_TYPE_TOOL,
  ENTITY_TYPE_VULNERABILITY
} from '../../schema/stixDomainObject';
import { REL_BUILT_IN, REL_EXTENDED, REL_NEW } from '../../database/stix';
import { ENTITY_TYPE_NARRATIVE } from '../narrative/narrative-types';
import { ENTITY_TYPE_CHANNEL } from '../channel/channel-types';
import { ENTITY_TYPE_EVENT } from '../event/event-types';
import { ENTITY_HASHED_OBSERVABLE_STIX_FILE } from '../../schema/stixCyberObservable';
import { ENTITY_TYPE_LOCATION_ADMINISTRATIVE_AREA } from '../administrativeArea/administrativeArea-types';
import { ENTITY_TYPE_IDENTITY_ORGANIZATION } from '../organization/organization-types';

interface Measures {
  measure: number | null
  date_seen: object | string | null
}
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const schemaMeasure: JSONSchemaType<Measures[]> = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      measure: { type: ['null', 'number'] },
      date_seen: { type: ['null', 'string', 'object'] },
    },
    required: ['measure', 'date_seen']
  }
};

const THREAT_ACTOR_INDIVIDUAL_DEFINITION: ModuleDefinition<StoreEntityThreatActorIndividual, StixThreatActorIndividual> = {
  type: {
    id: 'threat-actor-individual',
    name: ENTITY_TYPE_THREAT_ACTOR_INDIVIDUAL,
    category: ENTITY_TYPE_THREAT_ACTOR,
    aliased: true,
  },
  graphql: {
    schema: threatActorIndividualTypeDefs,
    resolver: threatActorIndividualResolvers,
  },
  identifier: {
    definition: {
      [ENTITY_TYPE_THREAT_ACTOR_INDIVIDUAL]: [{ src: NAME_FIELD }, { src: INNER_TYPE }]
    },
    resolvers: {
      name(data: object) {
        return normalizeName(data);
      },
    },
  },
  attributes: [
    { name: 'name', label: 'Name', type: 'string', mandatoryType: 'external', editDefault: true, multiple: false, upsert: true, isFilterable: true },
    { name: 'description', label: 'Description', type: 'string', mandatoryType: 'customizable', editDefault: true, multiple: false, upsert: true, isFilterable: true },
    { name: 'threat_actor_types', label: 'Threat actor types', type: 'string', mandatoryType: 'customizable', editDefault: true, multiple: true, upsert: false, isFilterable: true },
    { name: 'first_seen', label: 'First seen', type: 'date', mandatoryType: 'no', editDefault: false, multiple: false, upsert: true, isFilterable: true },
    { name: 'last_seen', label: 'Last seen', type: 'date', mandatoryType: 'no', editDefault: false, multiple: false, upsert: true, isFilterable: true },
    { name: 'goals', label: 'Goals', type: 'string', mandatoryType: 'no', editDefault: false, multiple: true, upsert: true, isFilterable: true },
    { name: 'roles', label: 'Roles', type: 'string', mandatoryType: 'no', editDefault: false, multiple: true, upsert: true, isFilterable: true },
    { name: 'sophistication', label: 'Sophistication', type: 'string', mandatoryType: 'no', editDefault: false, multiple: false, upsert: false, isFilterable: true },
    { name: 'resource_level', label: 'Resource level', type: 'string', mandatoryType: 'no', editDefault: false, multiple: false, upsert: true, isFilterable: true },
    { name: 'primary_motivation', label: 'Primary motivation', type: 'string', mandatoryType: 'no', editDefault: false, multiple: false, upsert: true, isFilterable: true },
    { name: 'secondary_motivations', label: 'Secondary motivation', type: 'string', mandatoryType: 'no', editDefault: false, multiple: true, upsert: true, isFilterable: true },
    { name: 'personal_motivations', label: 'Personal motivations', type: 'string', mandatoryType: 'no', editDefault: false, multiple: true, upsert: false, isFilterable: true },
    { name: 'date_of_birth', label: 'Date of birth', type: 'date', mandatoryType: 'no', editDefault: false, multiple: false, upsert: false, isFilterable: true },
    { name: 'gender', label: 'Gender', type: 'string', mandatoryType: 'no', editDefault: false, multiple: false, upsert: false, isFilterable: true },
    { name: 'job_title', label: 'Job title', type: 'string', mandatoryType: 'no', editDefault: false, multiple: false, upsert: false, isFilterable: true },
    { name: 'marital_status', label: 'Marital status', type: 'string', mandatoryType: 'no', editDefault: false, multiple: false, upsert: false, isFilterable: true },
    { name: 'eye_color', label: 'Eye color', type: 'string', mandatoryType: 'no', editDefault: false, multiple: false, upsert: false, isFilterable: true },
    { name: 'hair_color', label: 'Hair color', type: 'string', mandatoryType: 'no', editDefault: false, multiple: false, upsert: false, isFilterable: true },
    { name: 'height', label: 'Height', type: 'object', mandatoryType: 'no', editDefault: false, multiple: true, upsert: true, schemaDef: schemaMeasure, isFilterable: false },
    { name: 'weight', label: 'Weight', type: 'object', mandatoryType: 'no', editDefault: false, multiple: true, upsert: true, schemaDef: schemaMeasure, isFilterable: false },
  ],
  relations: [
    {
      name: RELATION_USES,
      targets: [
        { name: ENTITY_TYPE_TOOL, type: REL_BUILT_IN },
        { name: ENTITY_HASHED_OBSERVABLE_STIX_FILE, type: REL_EXTENDED },
        { name: ENTITY_TYPE_MALWARE, type: REL_BUILT_IN },
        { name: ENTITY_TYPE_NARRATIVE, type: REL_BUILT_IN },
        { name: ENTITY_TYPE_CHANNEL, type: REL_BUILT_IN },
        { name: ENTITY_TYPE_ATTACK_PATTERN, type: REL_BUILT_IN },
        { name: ENTITY_TYPE_INFRASTRUCTURE, type: REL_BUILT_IN },
      ]
    },
    {
      name: RELATION_TARGETS,
      targets: [
        { name: ENTITY_TYPE_LOCATION_CITY, type: REL_BUILT_IN },
        { name: ENTITY_TYPE_LOCATION_COUNTRY, type: REL_BUILT_IN },
        { name: ENTITY_TYPE_IDENTITY_INDIVIDUAL, type: REL_BUILT_IN },
        { name: ENTITY_TYPE_IDENTITY_ORGANIZATION, type: REL_BUILT_IN },
        { name: ENTITY_TYPE_IDENTITY_SYSTEM, type: REL_BUILT_IN },
        { name: ENTITY_TYPE_LOCATION_POSITION, type: REL_BUILT_IN },
        { name: ENTITY_TYPE_LOCATION_REGION, type: REL_BUILT_IN },
        { name: ENTITY_TYPE_IDENTITY_SECTOR, type: REL_BUILT_IN },
        { name: ENTITY_TYPE_VULNERABILITY, type: REL_BUILT_IN },
        { name: ENTITY_TYPE_EVENT, type: REL_EXTENDED },
        { name: ENTITY_TYPE_LOCATION_ADMINISTRATIVE_AREA, type: REL_BUILT_IN },
      ]
    },
    {
      name: RELATION_LOCATED_AT,
      targets: [
        { name: ENTITY_TYPE_LOCATION_CITY, type: REL_BUILT_IN },
        { name: ENTITY_TYPE_LOCATION_COUNTRY, type: REL_BUILT_IN },
        { name: ENTITY_TYPE_LOCATION_POSITION, type: REL_BUILT_IN },
        { name: ENTITY_TYPE_LOCATION_REGION, type: REL_BUILT_IN },
        { name: ENTITY_TYPE_LOCATION_ADMINISTRATIVE_AREA, type: REL_BUILT_IN },
      ]
    },
    {
      name: RELATION_ATTRIBUTED_TO,
      targets: [
        { name: ENTITY_TYPE_IDENTITY_INDIVIDUAL, type: REL_BUILT_IN },
        { name: ENTITY_TYPE_IDENTITY_ORGANIZATION, type: REL_BUILT_IN },
      ]
    },
    {
      name: RELATION_IMPERSONATES,
      targets: [
        { name: ENTITY_TYPE_IDENTITY_INDIVIDUAL, type: REL_BUILT_IN },
        { name: ENTITY_TYPE_IDENTITY_ORGANIZATION, type: REL_BUILT_IN },
      ]
    },
    {
      name: RELATION_COMPROMISES,
      targets: [
        { name: ENTITY_TYPE_INFRASTRUCTURE, type: REL_BUILT_IN },
      ]
    },
    {
      name: RELATION_HOSTS,
      targets: [
        { name: ENTITY_TYPE_INFRASTRUCTURE, type: REL_BUILT_IN },
      ]
    },
    {
      name: RELATION_OWNS,
      targets: [
        { name: ENTITY_TYPE_INFRASTRUCTURE, type: REL_BUILT_IN },
      ]
    },
    {
      name: RELATION_PARTICIPATES_IN,
      targets: [
        { name: ENTITY_TYPE_CAMPAIGN, type: REL_NEW },
      ]
    },
    {
      name: RELATION_PART_OF,
      targets: [
        { name: ENTITY_TYPE_THREAT_ACTOR_GROUP, type: REL_NEW },
        { name: ENTITY_TYPE_THREAT_ACTOR_INDIVIDUAL, type: REL_NEW },
      ]
    },
    {
      name: RELATION_COOPERATES_WITH,
      targets: [
        { name: ENTITY_TYPE_THREAT_ACTOR_GROUP, type: REL_NEW },
        { name: ENTITY_TYPE_THREAT_ACTOR_INDIVIDUAL, type: REL_NEW },
      ]
    },
    { name: RELATION_EMPLOYED_BY,
      targets: [
        { name: ENTITY_TYPE_THREAT_ACTOR_GROUP, type: REL_EXTENDED },
        { name: ENTITY_TYPE_IDENTITY_ORGANIZATION, type: REL_EXTENDED },
      ]
    },
    { name: RELATION_RESIDES_IN,
      targets: [
        { name: ENTITY_TYPE_LOCATION_COUNTRY, type: REL_EXTENDED },
      ]
    },
    { name: RELATION_CITIZEN_OF,
      targets: [
        { name: ENTITY_TYPE_LOCATION_COUNTRY, type: REL_EXTENDED },
      ]
    },
    { name: RELATION_NATIONAL_OF,
      targets: [
        { name: ENTITY_TYPE_LOCATION_COUNTRY, type: REL_EXTENDED },
      ]
    },
  ],
  relationsRefs: [
    objectOrganization,
    bornIn,
    ethnicity,
  ],
  representative: (stix: StixThreatActorIndividual) => {
    return stix.name;
  },
  converter: convertThreatActorIndividualToStix
};
registerDefinition(THREAT_ACTOR_INDIVIDUAL_DEFINITION);
