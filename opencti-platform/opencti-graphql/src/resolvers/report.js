import {
  addReport,
  findAll,
  findById,
  objectRefs,
  observableRefs,
  relationRefs,
  reportsDistributionByEntity,
  reportsNumber,
  reportsNumberByEntity,
  reportsTimeSeries,
  reportsTimeSeriesByAuthor,
  reportsTimeSeriesByEntity,
  reportContainsStixDomainEntity,
  reportContainsStixRelation,
  reportContainsStixObservable,
} from '../domain/report';
import {
  stixDomainEntityAddRelation,
  stixDomainEntityCleanContext,
  stixDomainEntityDelete,
  stixDomainEntityDeleteRelation,
  stixDomainEntityEditContext,
  stixDomainEntityEditField,
} from '../domain/stixDomainEntity';
import { REL_INDEX_PREFIX } from '../database/elasticSearch';
import {
  RELATION_CREATED_BY,
  RELATION_OBJECT_LABEL,
  RELATION_OBJECT,
  RELATION_OBJECT_MARKING,
} from '../utils/idGenerator';

const reportResolvers = {
  Query: {
    report: (_, { id }) => findById(id),
    reports: (_, args) => findAll(args),
    reportsTimeSeries: (_, args) => {
      if (args.objectId && args.objectId.length > 0) {
        return reportsTimeSeriesByEntity(args);
      }
      if (args.authorId && args.authorId.length > 0) {
        return reportsTimeSeriesByAuthor(args);
      }
      return reportsTimeSeries(args);
    },
    reportsNumber: (_, args) => {
      if (args.objectId && args.objectId.length > 0) {
        return reportsNumberByEntity(args);
      }
      return reportsNumber(args);
    },
    reportsDistribution: (_, args) => {
      if (args.objectId && args.objectId.length > 0) {
        return reportsDistributionByEntity(args);
      }
      return [];
    },
    reportContainsStixDomainEntity: (_, args) => {
      return reportContainsStixDomainEntity(args.id, args.objectId);
    },
    reportContainsStixRelation: (_, args) => {
      return reportContainsStixRelation(args.id, args.objectId);
    },
    reportContainsStixObservable: (_, args) => {
      return reportContainsStixObservable(args.id, args.objectId);
    },
  },
  ReportsOrdering: {
    markingDefinitions: `${REL_INDEX_PREFIX}${RELATION_OBJECT_MARKING}.definition`,
    labels: `${REL_INDEX_PREFIX}${RELATION_OBJECT_LABEL}.value`,
    createdBy: `${REL_INDEX_PREFIX}${RELATION_CREATED_BY}.name`,
  },
  ReportsFilter: {
    createdBy: `${REL_INDEX_PREFIX}${RELATION_CREATED_BY}.internal_id`,
    markingDefinitions: `${REL_INDEX_PREFIX}${RELATION_OBJECT_MARKING}.internal_id`,
    labels: `${REL_INDEX_PREFIX}${RELATION_OBJECT_LABEL}.internal_id`,
    knowledgeContains: `${REL_INDEX_PREFIX}${RELATION_OBJECT}.internal_id`,
    observablesContains: `${REL_INDEX_PREFIX}observable_refs.internal_id`,
  },
  Report: {
    objectRefs: (report, args) => objectRefs(report.id, args),
    observableRefs: (report, args) => observableRefs(report.id, args),
    relationRefs: (report, args) => relationRefs(report.id, args),
  },
  Mutation: {
    reportEdit: (_, { id }, { user }) => ({
      delete: () => stixDomainEntityDelete(user, id),
      fieldPatch: ({ input }) => stixDomainEntityEditField(user, id, input),
      contextPatch: ({ input }) => stixDomainEntityEditContext(user, id, input),
      contextClean: () => stixDomainEntityCleanContext(user, id),
      relationAdd: ({ input }) => stixDomainEntityAddRelation(user, id, input),
      relationDelete: ({ relationId, toId, relationType }) =>
        stixDomainEntityDeleteRelation(user, id, relationId, toId, relationType),
    }),
    reportAdd: (_, { input }, { user }) => addReport(user, input),
  },
};

export default reportResolvers;
