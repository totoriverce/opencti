import { confidence, created, lang, modified, relationshipType, revoked, xOpenctiStixIds } from '../../schema/attribute-definition';
import { schemaAttributesDefinition } from '../../schema/schema-attributes';
import { ABSTRACT_STIX_RELATIONSHIP } from '../../schema/general';
const stixRelationshipAttributes = [
    xOpenctiStixIds,
    created,
    modified,
    revoked,
    confidence,
    lang,
    relationshipType,
];
schemaAttributesDefinition.registerAttributes(ABSTRACT_STIX_RELATIONSHIP, stixRelationshipAttributes);
