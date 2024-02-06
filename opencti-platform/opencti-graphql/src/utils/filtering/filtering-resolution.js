var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { FilterMode, FilterOperator } from '../../generated/graphql';
import { ASSIGNEE_FILTER, CONNECTED_TO_INSTANCE_FILTER, CONNECTED_TO_INSTANCE_SIDE_EVENTS_FILTER, CREATED_BY_FILTER, INDICATOR_FILTER, INSTANCE_REGARDING_OF, LABEL_FILTER, MARKING_FILTER, OBJECT_CONTAINS_FILTER, PARTICIPANT_FILTER, RELATION_FROM_FILTER, RELATION_TO_FILTER, WORKFLOW_FILTER, } from './filtering-constants';
import { isUserCanAccessStixElement, SYSTEM_USER } from '../access';
import { getEntitiesListFromCache, getEntitiesMapFromCache } from '../../database/cache';
import { ENTITY_TYPE_RESOLVED_FILTERS } from '../../schema/stixDomainObject';
import { extractFilterGroupValues, isFilterGroupNotEmpty } from './filtering-utils';
import { ENTITY_TYPE_STATUS } from '../../schema/internalObject';
// list of all filters that needs resolution
export const RESOLUTION_FILTERS = [
    LABEL_FILTER,
    MARKING_FILTER,
    CREATED_BY_FILTER,
    ASSIGNEE_FILTER,
    PARTICIPANT_FILTER,
    OBJECT_CONTAINS_FILTER,
    RELATION_FROM_FILTER,
    RELATION_TO_FILTER,
    INSTANCE_REGARDING_OF,
    CONNECTED_TO_INSTANCE_FILTER,
    CONNECTED_TO_INSTANCE_SIDE_EVENTS_FILTER,
];
// map (filter key) <-> (corresponding prop key in a stix object)
const STIX_RESOLUTION_MAP_PATHS = {
    // [ASSIGNEE_FILTER]: 'id', // no resolution required in stix ; assignee_ids are internal ids already
    [CREATED_BY_FILTER]: 'id', // created by --> resolve with the standard id (which is the stix.id)
    [LABEL_FILTER]: 'value', // labels --> resolve id to stix.name
    [INDICATOR_FILTER]: 'type', // indicator types --> resolve id to stix.type
    [MARKING_FILTER]: 'id', // marking --> resolve id to standard id (which is the stix.id)
    [OBJECT_CONTAINS_FILTER]: 'id',
    [PARTICIPANT_FILTER]: 'id', // participant --> resolve with the standard id (which is the stix.id)
    [RELATION_FROM_FILTER]: 'id',
    [RELATION_TO_FILTER]: 'id',
    [CONNECTED_TO_INSTANCE_FILTER]: 'id', // instance trigger --> resolve with the standard id (which is the stix.id)
    [CONNECTED_TO_INSTANCE_SIDE_EVENTS_FILTER]: 'id', // instance trigger --> resolve with the standard id (which is the stix.id)
};
//----------------------------------------------------------------------------------------------------------------------
/**
 * Resolve some of the filter values according to a resolution map.
 * This concerns attributes that are not directly compared with a stix attribute due to modelization differences.
 * For instance, labels are entities internally, and filter.values would contain these entities internal ids.
 * In Stix, the labels are stored in plain text: we need to replace the ids in filter.values with their resolution.
 */
const resolveFilter = (context, user, filter, resolutionMap) => __awaiter(void 0, void 0, void 0, function* () {
    const { key, values } = filter;
    let newFilterValues = [];
    // 1. add the values from the resolution map if needed
    values.forEach((v) => {
        const resolution = resolutionMap.get(v);
        if (resolution) {
            newFilterValues.push(resolution);
        }
        else {
            newFilterValues.push(v);
        }
    });
    // 2. handle the special case of workflow filter
    if (key.includes(WORKFLOW_FILTER)) {
        // get all the statuses
        let statuses = yield getEntitiesListFromCache(context, user, ENTITY_TYPE_STATUS);
        // keep the statuses with their id corresponding to the filter values, or with their template id corresponding to the filter values
        statuses = statuses.filter((status) => values.includes(status.id) || values.includes(status.template_id));
        const statusIds = statuses.length > 0 ? statuses.map((status) => status.internal_id) : ['<no-status-matching-filter>'];
        // replace filter values with the statusIds
        // !!! it works to do the mode/operator filter on the status (and not on the template)
        // because a status can only have a single template and because the operators are full-match operators (eq/not_eq) !!!
        newFilterValues = statusIds;
    }
    return Object.assign(Object.assign({}, filter), { values: newFilterValues });
});
/**
 * Recursively call resolveFilter inside a filter group
 */
export const resolveFilterGroup = (context, user, filterGroup, resolutionMap) => __awaiter(void 0, void 0, void 0, function* () {
    const newFilterGroups = yield Promise.all(filterGroup.filterGroups.map((fg) => resolveFilterGroup(context, user, fg, resolutionMap)));
    const newFilters = yield Promise.all(filterGroup.filters.map((f) => resolveFilter(context, user, f, resolutionMap)));
    return Object.assign(Object.assign({}, filterGroup), { filters: newFilters, filterGroups: newFilterGroups });
});
//----------------------------------------------------------------------------------------------------------------------
/**
 * Build a resolution map thanks to the cache
 */
const buildResolutionMapForFilter = (context, user, filter, cache) => __awaiter(void 0, void 0, void 0, function* () {
    const map = new Map();
    if (Object.keys(STIX_RESOLUTION_MAP_PATHS).includes(filter.key[0])) {
        for (let index = 0; index < filter.values.length; index += 1) {
            const v = filter.values[index];
            // manipulating proper stix objects typing requires a lot of refactoring at this point (typeguards, etc)
            // like with isStixMatchFilterGroup, let's use any to describe our stix objects in cache
            const cachedObject = cache.get(v);
            const path = STIX_RESOLUTION_MAP_PATHS[filter.key[0]];
            if (cachedObject && path) {
                // some entities in cache might be restricted for this user or deleted
                if (!(yield isUserCanAccessStixElement(context, user, cachedObject))) {
                    // invalidate the filter value; it won't match ever, but we keep track of this invalidation for debug purposes
                    map.set(v, '<restricted-or-deleted>');
                }
                else {
                    // resolve according to path
                    const cachedValue = cachedObject[path];
                    if (typeof cachedValue === 'string') {
                        map.set(v, cachedValue);
                    }
                }
            }
        }
    }
    return map;
});
const mergeMaps = (mapArray) => {
    const mergedMap = new Map();
    mapArray.forEach((map) => {
        map.forEach((value, key) => {
            mergedMap.set(key, value);
        });
    });
    return mergedMap;
};
/**
 * recursively call buildResolutionMapForFilter inside a filter group
 */
export const buildResolutionMapForFilterGroup = (context, user, filterGroup, cache) => __awaiter(void 0, void 0, void 0, function* () {
    const filtersMaps = yield Promise.all(filterGroup.filters.map((f) => buildResolutionMapForFilter(context, user, f, cache)));
    const filterGroupsMaps = yield Promise.all(filterGroup.filterGroups.map((fg) => buildResolutionMapForFilterGroup(context, user, fg, cache)));
    // merge all maps into one; for a given unique key the last value wins
    return mergeMaps([mergeMaps(filtersMaps), mergeMaps(filterGroupsMaps)]);
});
//----------------------------------------------------------------------------------------------------------------------
/**
 * Extract all filter values (ids) that might require a resolution from cache "Resolved-Filters"
 * @param filterGroup
 */
export const extractFilterGroupValuesToResolveForCache = (filterGroup) => {
    return extractFilterGroupValues(filterGroup, RESOLUTION_FILTERS);
};
// build a map ([id]: StixObject) with the resolved filters accessible for a user
// used for instance trigger side events message display only !!!
export const resolveFiltersMapForUser = (context, user, inputFilters) => __awaiter(void 0, void 0, void 0, function* () {
    const resolveUserMap = new Map();
    if (!inputFilters)
        return resolveUserMap;
    const resolvedMap = yield getEntitiesMapFromCache(context, SYSTEM_USER, ENTITY_TYPE_RESOLVED_FILTERS);
    const { filters } = inputFilters; // instance triggers don't handle imbricated filterGroups, we only handle filters at the first level
    for (let index = 0; index < filters.length; index += 1) {
        const { values = [] } = filters[index];
        for (let vIndex = 0; vIndex < values.length; vIndex += 1) {
            const v = values[vIndex];
            if (resolvedMap.has(v)) {
                const stixInstance = resolvedMap.get(v);
                const isUserHasAccessToElement = !!stixInstance && (yield isUserCanAccessStixElement(context, user, stixInstance));
                if (isUserHasAccessToElement) {
                    resolveUserMap.set(stixInstance.id, stixInstance);
                }
            }
        }
    }
    return resolveUserMap;
});
export const convertFiltersToQueryOptions = (filters, opts = {}) => __awaiter(void 0, void 0, void 0, function* () {
    const { after, before, defaultTypes = [], field = 'updated_at', orderMode = 'asc' } = opts;
    const types = [...defaultTypes];
    let finalFilters = filters;
    if (after || before) {
        const filtersContent = [];
        if (after) {
            filtersContent.push({ key: field, values: [after], operator: FilterOperator.Gte });
        }
        if (before) {
            filtersContent.push({ key: field, values: [before], operator: FilterOperator.Lte });
        }
        finalFilters = {
            mode: FilterMode.And,
            filters: filtersContent,
            filterGroups: (finalFilters && isFilterGroupNotEmpty(finalFilters)) ? [finalFilters] : [],
        };
    }
    return { types, orderMode, orderBy: [field, 'internal_id'], filters: finalFilters };
});
