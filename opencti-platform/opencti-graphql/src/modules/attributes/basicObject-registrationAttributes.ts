import {
  AttributeDefinition,
  createdAt,
  entityType,
  internalId,
  standardId,
  updatedAt
} from '../../schema/attribute-definition';
import { schemaAttributesDefinition } from '../../schema/schema-attributes';
import { ABSTRACT_BASIC_OBJECT } from '../../schema/general';

const basicObjectAttributes: Array<AttributeDefinition> = [
  internalId,
  standardId,
  entityType,
  createdAt,
  updatedAt,
];
schemaAttributesDefinition.registerAttributes(ABSTRACT_BASIC_OBJECT, basicObjectAttributes);
