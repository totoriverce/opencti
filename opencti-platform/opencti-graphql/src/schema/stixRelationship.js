import { isStixCoreRelationship } from './stixCoreRelationship';
import { isStixSightingRelationship } from './stixSightingRelationship';
import { isInternalRelationship } from './internalRelationship';
import { ABSTRACT_BASIC_RELATIONSHIP, ABSTRACT_STIX_RELATIONSHIP } from './general';
import { isStixRefRelationship } from './stixRefRelationship';
export const isStixRelationshipExceptRef = (type) => isStixCoreRelationship(type) || isStixSightingRelationship(type);
export const isStixRelationship = (type) => isStixCoreRelationship(type)
    || isStixSightingRelationship(type)
    || isStixRefRelationship(type)
    || type === ABSTRACT_STIX_RELATIONSHIP;
export const isBasicRelationship = (type) => isInternalRelationship(type) || isStixRelationship(type) || type === ABSTRACT_BASIC_RELATIONSHIP;
