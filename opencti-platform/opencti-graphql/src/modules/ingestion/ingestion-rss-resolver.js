import { addIngestion, findAllPaginated, findById, ingestionDelete, ingestionEditField, } from './ingestion-rss-domain';
import { batchLoader } from '../../database/middleware';
import { elBatchIds } from '../../database/engine';
import { batchCreator } from '../../domain/user';
import { storeLoadByIds } from '../../database/middleware-loader';
import { ENTITY_TYPE_MARKING_DEFINITION } from '../../schema/stixMetaObject';
import { ENTITY_TYPE_IDENTITY } from '../../schema/general';
const loadByIdLoader = batchLoader(elBatchIds);
const creatorLoader = batchLoader(batchCreator);
const ingestionRssResolvers = {
    Query: {
        ingestionRss: (_, { id }, context) => findById(context, context.user, id),
        ingestionRsss: (_, args, context) => findAllPaginated(context, context.user, args),
    },
    IngestionRss: {
        defaultCreatedBy: (ingestionRss, _, context) => loadByIdLoader.load({ id: ingestionRss.created_by_ref, type: ENTITY_TYPE_IDENTITY }, context, context.user),
        // eslint-disable-next-line max-len
        defaultMarkingDefinitions: (ingestionRss, _, context) => { var _a; return storeLoadByIds(context, context.user, (_a = ingestionRss.object_marking_refs) !== null && _a !== void 0 ? _a : [], ENTITY_TYPE_MARKING_DEFINITION); },
        user: (ingestionRss, _, context) => creatorLoader.load(ingestionRss.user_id, context, context.user),
    },
    Mutation: {
        ingestionRssAdd: (_, { input }, context) => {
            return addIngestion(context, context.user, input);
        },
        ingestionRssDelete: (_, { id }, context) => {
            return ingestionDelete(context, context.user, id);
        },
        ingestionRssFieldPatch: (_, { id, input }, context) => {
            return ingestionEditField(context, context.user, id, input);
        },
    },
};
export default ingestionRssResolvers;
