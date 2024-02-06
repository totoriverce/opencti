/*
Copyright (c) 2021-2023 Filigran SAS

This file is part of the OpenCTI Enterprise Edition ("EE") and is
licensed under the OpenCTI Non-Commercial License (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

https://github.com/OpenCTI-Platform/opencti/blob/master/LICENSE

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a;
import { LRUCache } from 'lru-cache';
import { registerUserActionListener } from '../listener/UserActionListener';
import conf, { logAudit } from '../config/conf';
import { isEmptyField } from '../database/utils';
import { EVENT_ACTIVITY_VERSION, storeActivityEvent } from '../database/redis';
import { getEntityFromCache } from '../database/cache';
import { ENTITY_TYPE_SETTINGS, isInternalObject } from '../schema/internalObject';
import { executionContext, SYSTEM_USER } from '../utils/access';
import { ENTITY_TYPE_WORKSPACE } from '../modules/workspace/workspace-types';
import { isStixCoreRelationship } from '../schema/stixCoreRelationship';
import { isStixCoreObject } from '../schema/stixCoreObject';
const INTERNAL_READ_ENTITIES = [ENTITY_TYPE_WORKSPACE];
const LOGS_SENSITIVE_FIELDS = (_a = conf.get('app:app_logs:logs_redacted_inputs')) !== null && _a !== void 0 ? _a : [];
const initActivityManager = () => {
    const activityReadCache = new LRUCache({ ttl: 60 * 60 * 1000, max: 5000 }); // Read lifetime is 1 hour
    const cleanInputData = (obj) => {
        const stack = [obj];
        while (stack.length > 0) {
            const currentObj = stack.pop();
            Object.keys(currentObj).forEach((key) => {
                if (LOGS_SENSITIVE_FIELDS.includes(key)) {
                    currentObj[key] = '*** Redacted ***';
                }
                if (typeof currentObj[key] === 'object' && currentObj[key] !== null) {
                    stack.push(currentObj[key]);
                }
            });
        }
        return obj;
    };
    const buildActivityStreamEvent = (action, message) => {
        var _a, _b, _c;
        const data = cleanInputData((_a = action.context_data) !== null && _a !== void 0 ? _a : {});
        return {
            version: EVENT_ACTIVITY_VERSION,
            type: action.event_type,
            event_access: action.event_access,
            event_scope: action.event_scope,
            prevent_indexing: (_b = action.prevent_indexing) !== null && _b !== void 0 ? _b : false,
            status: (_c = action.status) !== null && _c !== void 0 ? _c : 'success',
            origin: action.user.origin,
            message,
            data,
        };
    };
    const activityLogger = (action, message) => __awaiter(void 0, void 0, void 0, function* () {
        const level = action.status === 'error' ? 'error' : 'info';
        // If standard action, log and push to activity stream.
        const event = buildActivityStreamEvent(action, message);
        const meta = {
            version: event.version,
            type: event.type,
            event_scope: event.event_scope,
            event_access: event.event_access,
            data: event.data
        };
        // In admin case put that to logs/console
        if (action.event_access === 'administration') {
            logAudit._log(level, action.user, message, meta);
        }
        // In all case, store in history
        yield storeActivityEvent(event);
        return true;
    });
    const readActivity = (action) => __awaiter(void 0, void 0, void 0, function* () {
        const { id, entity_type, entity_name } = action.context_data;
        const identifier = `${id}-${action.user.id}`;
        // Auto read only for stix knowledge, for other internal elements, it must be
        if (!activityReadCache.has(identifier)) {
            const message = `reads \`${entity_name}\` (${entity_type})`;
            const published = yield activityLogger(action, message);
            if (published) {
                activityReadCache.set(identifier, 'published');
            }
        }
    });
    const activityHandler = {
        id: 'ACTIVITY_MANAGER',
        next: (action) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            const context = executionContext('activity_listener');
            const settings = yield getEntityFromCache(context, SYSTEM_USER, ENTITY_TYPE_SETTINGS);
            // 01. Check activity authorization
            if (!['query', 'internal'].includes((_a = action.user.origin.socket) !== null && _a !== void 0 ? _a : '')) { // Subscription is not part of the listening
                return;
            }
            if (isEmptyField(settings.enterprise_edition)) { // If enterprise edition is not activated
                return;
            }
            const isUserListening = ((_b = settings.activity_listeners_users) !== null && _b !== void 0 ? _b : []).includes(action.user.id);
            if (action.event_access === 'extended' && !isUserListening) { // If extended actions, is action is not for listened user
                return;
            }
            // 02. Handle activities
            if (action.event_type === 'authentication') {
                if (action.event_scope === 'login') {
                    const { provider, username } = action.context_data;
                    const isFailLogin = action.status === 'error';
                    const message = isFailLogin ? `detects \`login failure\` for \`${username}\``
                        : `login from provider \`${provider}\``;
                    yield activityLogger(action, message);
                }
                if (action.event_scope === 'logout') {
                    yield activityLogger(action, 'logout');
                }
            }
            if (action.event_type === 'read') {
                if (action.event_scope === 'unauthorized') {
                    const message = `tries an \`unauthorized ${action.event_type}\``;
                    yield activityLogger(action, message);
                }
                if (action.event_scope === 'read') {
                    const { entity_type } = action.context_data;
                    const isKnowledgeListening = isStixCoreObject(entity_type) || isStixCoreRelationship(entity_type);
                    const isInternalListening = isInternalObject(entity_type) && INTERNAL_READ_ENTITIES.includes(entity_type);
                    if (isKnowledgeListening || isInternalListening) {
                        yield readActivity(action);
                    }
                }
            }
            if (action.event_type === 'file') {
                const isFailAction = action.status === 'error';
                const prefixMessage = isFailAction ? 'failure ' : '';
                if (action.event_scope === 'read') {
                    const { file_name, entity_name } = action.context_data;
                    const message = `${prefixMessage} reads from \`${entity_name}\` the file \`${file_name}\``;
                    yield activityLogger(action, message);
                }
                if (action.event_scope === 'download') {
                    const { file_name, entity_name } = action.context_data;
                    const message = `${prefixMessage}  downloads from \`${entity_name}\` the file \`${file_name}\``;
                    yield activityLogger(action, message);
                }
                if (action.event_scope === 'create') {
                    const { file_name, entity_name, entity_type, path } = action.context_data;
                    let message = `adds \`${file_name}\` in \`files\` for \`${entity_name}\` (${entity_type})`;
                    if (path.includes('import/pending')) {
                        message = `creates Analyst Workbench \`${file_name}\` for \`${entity_name}\` (${entity_type})`;
                    }
                    yield activityLogger(action, message);
                }
                if (action.event_scope === 'delete') { // General upload
                    const { file_name, entity_name, entity_type, path } = action.context_data;
                    let message = `removes \`${file_name}\` in \`files\` for \`${entity_name}\` (${entity_type})`;
                    if (path.includes('import/pending')) {
                        message = `removes Analyst Workbench \`${file_name}\` for \`${entity_name}\` (${entity_type})`;
                    }
                    yield activityLogger(action, message);
                }
            }
            if (action.event_type === 'command') {
                if (action.event_scope === 'search') {
                    const message = 'asks for `advanced search`';
                    yield activityLogger(action, message);
                }
                if (action.event_scope === 'export') {
                    const { format, entity_name } = action.context_data;
                    const message = `asks for \`${format}\` export in \`${entity_name}\``;
                    yield activityLogger(action, message);
                }
                if (action.event_scope === 'import') {
                    const { file_name, file_mime, entity_name } = action.context_data;
                    const message = `asks for \`${file_mime}\` import of \`${file_name}\` in \`${entity_name}\``;
                    yield activityLogger(action, message);
                }
                if (action.event_scope === 'enrich') {
                    const { entity_name, connector_name } = action.context_data;
                    const message = `asks for \`${connector_name}\` enrichment in \`${entity_name}\``;
                    yield activityLogger(action, message);
                }
            }
            if (action.event_type === 'mutation') {
                if (action.event_scope === 'unauthorized') {
                    const message = `tries an \`unauthorized ${action.event_type}\``;
                    yield activityLogger(action, message);
                }
                if (action.event_scope === 'create') {
                    yield activityLogger(action, action.message);
                }
                if (action.event_scope === 'update') {
                    yield activityLogger(action, action.message);
                }
                if (action.event_scope === 'delete') {
                    yield activityLogger(action, action.message);
                }
            }
        })
    };
    let handler;
    return {
        start: () => __awaiter(void 0, void 0, void 0, function* () {
            handler = registerUserActionListener(activityHandler);
        }),
        status: () => {
            return {
                id: 'ACTIVITY_MANAGER',
                enable: true,
                running: true,
            };
        },
        shutdown: () => __awaiter(void 0, void 0, void 0, function* () {
            if (handler) {
                handler.unregister();
            }
            return true;
        }),
    };
};
const activityListener = initActivityManager();
export default activityListener;
