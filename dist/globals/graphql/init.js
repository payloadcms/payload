"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-param-reassign */
const graphql_1 = require("graphql");
const pluralize_1 = require("pluralize");
const formatName_1 = __importDefault(require("../../graphql/utilities/formatName"));
const buildGlobalFields_1 = require("../../versions/buildGlobalFields");
const buildPaginatedListType_1 = __importDefault(require("../../graphql/schema/buildPaginatedListType"));
const findOne_1 = __importDefault(require("./resolvers/findOne"));
const update_1 = __importDefault(require("./resolvers/update"));
const findVersionByID_1 = __importDefault(require("./resolvers/findVersionByID"));
const findVersions_1 = __importDefault(require("./resolvers/findVersions"));
const restoreVersion_1 = __importDefault(require("./resolvers/restoreVersion"));
const buildObjectType_1 = __importDefault(require("../../graphql/schema/buildObjectType"));
const buildMutationInputType_1 = __importDefault(require("../../graphql/schema/buildMutationInputType"));
const buildWhereInputType_1 = __importDefault(require("../../graphql/schema/buildWhereInputType"));
const formatLabels_1 = require("../../utilities/formatLabels");
const buildPoliciesType_1 = require("../../graphql/schema/buildPoliciesType");
const docAccess_1 = require("./resolvers/docAccess");
function initGlobalsGraphQL(payload) {
    if (payload.config.globals) {
        Object.keys(payload.globals.config).forEach((slug) => {
            var _a;
            const global = payload.globals.config[slug];
            const { fields, versions, } = global;
            const formattedName = ((_a = global.graphQL) === null || _a === void 0 ? void 0 : _a.name) ? global.graphQL.name : (0, pluralize_1.singular)((0, formatLabels_1.toWords)(global.slug, true));
            const forceNullableObjectType = Boolean(versions === null || versions === void 0 ? void 0 : versions.drafts);
            if (!payload.globals.graphQL)
                payload.globals.graphQL = {};
            payload.globals.graphQL[slug] = {
                type: (0, buildObjectType_1.default)({
                    payload,
                    name: formattedName,
                    parentName: formattedName,
                    fields,
                    forceNullable: forceNullableObjectType,
                }),
                mutationInputType: new graphql_1.GraphQLNonNull((0, buildMutationInputType_1.default)(payload, formattedName, fields, formattedName)),
            };
            payload.Query.fields[formattedName] = {
                type: payload.globals.graphQL[slug].type,
                args: {
                    draft: { type: graphql_1.GraphQLBoolean },
                    ...(payload.config.localization ? {
                        locale: { type: payload.types.localeInputType },
                        fallbackLocale: { type: payload.types.fallbackLocaleInputType },
                    } : {}),
                },
                resolve: (0, findOne_1.default)(global),
            };
            payload.Mutation.fields[`update${formattedName}`] = {
                type: payload.globals.graphQL[slug].type,
                args: {
                    data: { type: payload.globals.graphQL[slug].mutationInputType },
                    draft: { type: graphql_1.GraphQLBoolean },
                    ...(payload.config.localization ? {
                        locale: { type: payload.types.localeInputType },
                    } : {}),
                },
                resolve: (0, update_1.default)(global),
            };
            payload.Query.fields[`docAccess${formattedName}`] = {
                type: (0, buildPoliciesType_1.buildPolicyType)({
                    typeSuffix: 'DocAccess',
                    entity: global,
                    type: 'global',
                    scope: 'docAccess',
                }),
                resolve: (0, docAccess_1.docAccessResolver)(global),
            };
            if (global.versions) {
                const versionGlobalFields = [
                    ...(0, buildGlobalFields_1.buildVersionGlobalFields)(global),
                    {
                        name: 'id',
                        type: 'text',
                    },
                    {
                        name: 'createdAt',
                        label: 'Created At',
                        type: 'date',
                    },
                    {
                        name: 'updatedAt',
                        label: 'Updated At',
                        type: 'date',
                    },
                ];
                payload.globals.graphQL[slug].versionType = (0, buildObjectType_1.default)({
                    payload,
                    name: `${formattedName}Version`,
                    parentName: `${formattedName}Version`,
                    fields: versionGlobalFields,
                    forceNullable: forceNullableObjectType,
                });
                payload.Query.fields[`version${(0, formatName_1.default)(formattedName)}`] = {
                    type: payload.globals.graphQL[slug].versionType,
                    args: {
                        id: { type: graphql_1.GraphQLString },
                        ...(payload.config.localization ? {
                            locale: { type: payload.types.localeInputType },
                            fallbackLocale: { type: payload.types.fallbackLocaleInputType },
                        } : {}),
                    },
                    resolve: (0, findVersionByID_1.default)(global),
                };
                payload.Query.fields[`versions${formattedName}`] = {
                    type: (0, buildPaginatedListType_1.default)(`versions${(0, formatName_1.default)(formattedName)}`, payload.globals.graphQL[slug].versionType),
                    args: {
                        where: {
                            type: (0, buildWhereInputType_1.default)(`versions${formattedName}`, versionGlobalFields, `versions${formattedName}`),
                        },
                        ...(payload.config.localization ? {
                            locale: { type: payload.types.localeInputType },
                            fallbackLocale: { type: payload.types.fallbackLocaleInputType },
                        } : {}),
                        page: { type: graphql_1.GraphQLInt },
                        limit: { type: graphql_1.GraphQLInt },
                        sort: { type: graphql_1.GraphQLString },
                    },
                    resolve: (0, findVersions_1.default)(global),
                };
                payload.Mutation.fields[`restoreVersion${(0, formatName_1.default)(formattedName)}`] = {
                    type: payload.globals.graphQL[slug].type,
                    args: {
                        id: { type: graphql_1.GraphQLString },
                    },
                    resolve: (0, restoreVersion_1.default)(global),
                };
            }
        });
    }
}
exports.default = initGlobalsGraphQL;
//# sourceMappingURL=init.js.map