"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-param-reassign */
const graphql_scalars_1 = require("graphql-scalars");
const graphql_1 = require("graphql");
const formatName_1 = __importDefault(require("../../graphql/utilities/formatName"));
const buildPaginatedListType_1 = __importDefault(require("../../graphql/schema/buildPaginatedListType"));
const buildMutationInputType_1 = __importStar(require("../../graphql/schema/buildMutationInputType"));
const buildCollectionFields_1 = require("../../versions/buildCollectionFields");
const create_1 = __importDefault(require("./resolvers/create"));
const update_1 = __importDefault(require("./resolvers/update"));
const find_1 = __importDefault(require("./resolvers/find"));
const findByID_1 = __importDefault(require("./resolvers/findByID"));
const findVersionByID_1 = __importDefault(require("./resolvers/findVersionByID"));
const findVersions_1 = __importDefault(require("./resolvers/findVersions"));
const restoreVersion_1 = __importDefault(require("./resolvers/restoreVersion"));
const me_1 = __importDefault(require("../../auth/graphql/resolvers/me"));
const init_1 = __importDefault(require("../../auth/graphql/resolvers/init"));
const login_1 = __importDefault(require("../../auth/graphql/resolvers/login"));
const logout_1 = __importDefault(require("../../auth/graphql/resolvers/logout"));
const forgotPassword_1 = __importDefault(require("../../auth/graphql/resolvers/forgotPassword"));
const resetPassword_1 = __importDefault(require("../../auth/graphql/resolvers/resetPassword"));
const verifyEmail_1 = __importDefault(require("../../auth/graphql/resolvers/verifyEmail"));
const unlock_1 = __importDefault(require("../../auth/graphql/resolvers/unlock"));
const refresh_1 = __importDefault(require("../../auth/graphql/resolvers/refresh"));
const types_1 = require("../../fields/config/types");
const buildObjectType_1 = __importDefault(require("../../graphql/schema/buildObjectType"));
const buildWhereInputType_1 = __importDefault(require("../../graphql/schema/buildWhereInputType"));
const delete_1 = __importDefault(require("./resolvers/delete"));
const formatLabels_1 = require("../../utilities/formatLabels");
const buildPoliciesType_1 = require("../../graphql/schema/buildPoliciesType");
const docAccess_1 = require("./resolvers/docAccess");
function initCollectionsGraphQL(payload) {
    Object.keys(payload.collections).forEach((slug) => {
        const collection = payload.collections[slug];
        const { config: { graphQL = {}, fields, timestamps, versions, }, } = collection;
        let singularName;
        let pluralName;
        const fromSlug = (0, formatLabels_1.formatNames)(collection.config.slug);
        if (graphQL.singularName) {
            singularName = (0, formatLabels_1.toWords)(graphQL.singularName, true);
        }
        else {
            singularName = fromSlug.singular;
        }
        if (graphQL.pluralName) {
            pluralName = (0, formatLabels_1.toWords)(graphQL.pluralName, true);
        }
        else {
            pluralName = fromSlug.plural;
        }
        // For collections named 'Media' or similar,
        // there is a possibility that the singular name
        // will equal the plural name. Append `all` to the beginning
        // of potential conflicts
        if (singularName === pluralName) {
            pluralName = `all${singularName}`;
        }
        collection.graphQL = {};
        const idField = fields.find((field) => (0, types_1.fieldAffectsData)(field) && field.name === 'id');
        const idType = (0, buildMutationInputType_1.getCollectionIDType)(collection.config);
        const baseFields = {};
        const whereInputFields = [
            ...fields,
        ];
        if (!idField) {
            baseFields.id = { type: idType };
            whereInputFields.push({
                name: 'id',
                type: 'text',
            });
        }
        if (timestamps) {
            baseFields.createdAt = {
                type: new graphql_1.GraphQLNonNull(graphql_scalars_1.DateTimeResolver),
            };
            baseFields.updatedAt = {
                type: new graphql_1.GraphQLNonNull(graphql_scalars_1.DateTimeResolver),
            };
            whereInputFields.push({
                name: 'createdAt',
                label: 'Created At',
                type: 'date',
            });
            whereInputFields.push({
                name: 'updatedAt',
                label: 'Updated At',
                type: 'date',
            });
        }
        const forceNullableObjectType = Boolean(versions === null || versions === void 0 ? void 0 : versions.drafts);
        collection.graphQL.type = (0, buildObjectType_1.default)({
            payload,
            name: singularName,
            parentName: singularName,
            fields,
            baseFields,
            forceNullable: forceNullableObjectType,
        });
        collection.graphQL.whereInputType = (0, buildWhereInputType_1.default)(singularName, whereInputFields, singularName);
        if (collection.config.auth && !collection.config.auth.disableLocalStrategy) {
            fields.push({
                name: 'password',
                label: 'Password',
                type: 'text',
                required: true,
            });
        }
        collection.graphQL.mutationInputType = new graphql_1.GraphQLNonNull((0, buildMutationInputType_1.default)(payload, singularName, fields, singularName));
        collection.graphQL.updateMutationInputType = new graphql_1.GraphQLNonNull((0, buildMutationInputType_1.default)(payload, `${singularName}Update`, fields.filter((field) => !((0, types_1.fieldAffectsData)(field) && field.name === 'id')), `${singularName}Update`, true));
        payload.Query.fields[singularName] = {
            type: collection.graphQL.type,
            args: {
                id: { type: new graphql_1.GraphQLNonNull(idType) },
                draft: { type: graphql_1.GraphQLBoolean },
                ...(payload.config.localization ? {
                    locale: { type: payload.types.localeInputType },
                    fallbackLocale: { type: payload.types.fallbackLocaleInputType },
                } : {}),
            },
            resolve: (0, findByID_1.default)(collection),
        };
        payload.Query.fields[pluralName] = {
            type: (0, buildPaginatedListType_1.default)(pluralName, collection.graphQL.type),
            args: {
                where: { type: collection.graphQL.whereInputType },
                draft: { type: graphql_1.GraphQLBoolean },
                ...(payload.config.localization ? {
                    locale: { type: payload.types.localeInputType },
                    fallbackLocale: { type: payload.types.fallbackLocaleInputType },
                } : {}),
                page: { type: graphql_1.GraphQLInt },
                limit: { type: graphql_1.GraphQLInt },
                sort: { type: graphql_1.GraphQLString },
            },
            resolve: (0, find_1.default)(collection),
        };
        payload.Query.fields[`docAccess${singularName}`] = {
            type: (0, buildPoliciesType_1.buildPolicyType)({
                typeSuffix: 'DocAccess',
                entity: collection.config,
                type: 'collection',
                scope: 'docAccess',
            }),
            args: {
                id: { type: new graphql_1.GraphQLNonNull(idType) },
            },
            resolve: (0, docAccess_1.docAccessResolver)(),
        };
        payload.Mutation.fields[`create${singularName}`] = {
            type: collection.graphQL.type,
            args: {
                data: { type: collection.graphQL.mutationInputType },
                draft: { type: graphql_1.GraphQLBoolean },
                ...(payload.config.localization ? {
                    locale: { type: payload.types.localeInputType },
                } : {}),
            },
            resolve: (0, create_1.default)(collection),
        };
        payload.Mutation.fields[`update${singularName}`] = {
            type: collection.graphQL.type,
            args: {
                id: { type: new graphql_1.GraphQLNonNull(idType) },
                data: { type: collection.graphQL.updateMutationInputType },
                draft: { type: graphql_1.GraphQLBoolean },
                autosave: { type: graphql_1.GraphQLBoolean },
                ...(payload.config.localization ? {
                    locale: { type: payload.types.localeInputType },
                } : {}),
            },
            resolve: (0, update_1.default)(collection),
        };
        payload.Mutation.fields[`delete${singularName}`] = {
            type: collection.graphQL.type,
            args: {
                id: { type: new graphql_1.GraphQLNonNull(idType) },
            },
            resolve: (0, delete_1.default)(collection),
        };
        if (collection.config.versions) {
            const versionCollectionFields = [
                ...(0, buildCollectionFields_1.buildVersionCollectionFields)(collection.config),
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
            collection.graphQL.versionType = (0, buildObjectType_1.default)({
                payload,
                name: `${singularName}Version`,
                fields: versionCollectionFields,
                parentName: `${singularName}Version`,
                forceNullable: forceNullableObjectType,
            });
            payload.Query.fields[`version${(0, formatName_1.default)(singularName)}`] = {
                type: collection.graphQL.versionType,
                args: {
                    id: { type: graphql_1.GraphQLString },
                    ...(payload.config.localization ? {
                        locale: { type: payload.types.localeInputType },
                        fallbackLocale: { type: payload.types.fallbackLocaleInputType },
                    } : {}),
                },
                resolve: (0, findVersionByID_1.default)(collection),
            };
            payload.Query.fields[`versions${pluralName}`] = {
                type: (0, buildPaginatedListType_1.default)(`versions${(0, formatName_1.default)(pluralName)}`, collection.graphQL.versionType),
                args: {
                    where: {
                        type: (0, buildWhereInputType_1.default)(`versions${singularName}`, versionCollectionFields, `versions${singularName}`),
                    },
                    ...(payload.config.localization ? {
                        locale: { type: payload.types.localeInputType },
                        fallbackLocale: { type: payload.types.fallbackLocaleInputType },
                    } : {}),
                    page: { type: graphql_1.GraphQLInt },
                    limit: { type: graphql_1.GraphQLInt },
                    sort: { type: graphql_1.GraphQLString },
                },
                resolve: (0, findVersions_1.default)(collection),
            };
            payload.Mutation.fields[`restoreVersion${(0, formatName_1.default)(singularName)}`] = {
                type: collection.graphQL.type,
                args: {
                    id: { type: graphql_1.GraphQLString },
                },
                resolve: (0, restoreVersion_1.default)(collection),
            };
        }
        if (collection.config.auth) {
            const authFields = collection.config.auth.disableLocalStrategy ? [] : [{
                    name: 'email',
                    type: 'email',
                    required: true,
                }];
            collection.graphQL.JWT = (0, buildObjectType_1.default)({
                payload,
                name: (0, formatName_1.default)(`${slug}JWT`),
                fields: [
                    ...collection.config.fields.filter((field) => (0, types_1.fieldAffectsData)(field) && field.saveToJWT),
                    ...authFields,
                    {
                        name: 'collection',
                        type: 'text',
                        required: true,
                    },
                ],
                parentName: (0, formatName_1.default)(`${slug}JWT`),
            });
            payload.Query.fields[`me${singularName}`] = {
                type: new graphql_1.GraphQLObjectType({
                    name: (0, formatName_1.default)(`${slug}Me`),
                    fields: {
                        token: {
                            type: graphql_1.GraphQLString,
                        },
                        user: {
                            type: collection.graphQL.type,
                        },
                        exp: {
                            type: graphql_1.GraphQLInt,
                        },
                        collection: {
                            type: graphql_1.GraphQLString,
                        },
                    },
                }),
                resolve: (0, me_1.default)(collection),
            };
            payload.Query.fields[`initialized${singularName}`] = {
                type: graphql_1.GraphQLBoolean,
                resolve: (0, init_1.default)(collection),
            };
            payload.Mutation.fields[`refreshToken${singularName}`] = {
                type: new graphql_1.GraphQLObjectType({
                    name: (0, formatName_1.default)(`${slug}Refreshed${singularName}`),
                    fields: {
                        user: {
                            type: collection.graphQL.JWT,
                        },
                        refreshedToken: {
                            type: graphql_1.GraphQLString,
                        },
                        exp: {
                            type: graphql_1.GraphQLInt,
                        },
                    },
                }),
                args: {
                    token: { type: graphql_1.GraphQLString },
                },
                resolve: (0, refresh_1.default)(collection),
            };
            payload.Mutation.fields[`logout${singularName}`] = {
                type: graphql_1.GraphQLString,
                resolve: (0, logout_1.default)(collection),
            };
            if (!collection.config.auth.disableLocalStrategy) {
                if (collection.config.auth.maxLoginAttempts > 0) {
                    payload.Mutation.fields[`unlock${singularName}`] = {
                        type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLBoolean),
                        args: {
                            email: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
                        },
                        resolve: (0, unlock_1.default)(collection),
                    };
                }
                payload.Mutation.fields[`login${singularName}`] = {
                    type: new graphql_1.GraphQLObjectType({
                        name: (0, formatName_1.default)(`${slug}LoginResult`),
                        fields: {
                            token: {
                                type: graphql_1.GraphQLString,
                            },
                            user: {
                                type: collection.graphQL.type,
                            },
                            exp: {
                                type: graphql_1.GraphQLInt,
                            },
                        },
                    }),
                    args: {
                        email: { type: graphql_1.GraphQLString },
                        password: { type: graphql_1.GraphQLString },
                    },
                    resolve: (0, login_1.default)(collection),
                };
                payload.Mutation.fields[`forgotPassword${singularName}`] = {
                    type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLBoolean),
                    args: {
                        email: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
                        disableEmail: { type: graphql_1.GraphQLBoolean },
                        expiration: { type: graphql_1.GraphQLInt },
                    },
                    resolve: (0, forgotPassword_1.default)(collection),
                };
                payload.Mutation.fields[`resetPassword${singularName}`] = {
                    type: new graphql_1.GraphQLObjectType({
                        name: (0, formatName_1.default)(`${slug}ResetPassword`),
                        fields: {
                            token: { type: graphql_1.GraphQLString },
                            user: { type: collection.graphQL.type },
                        },
                    }),
                    args: {
                        token: { type: graphql_1.GraphQLString },
                        password: { type: graphql_1.GraphQLString },
                    },
                    resolve: (0, resetPassword_1.default)(collection),
                };
                payload.Mutation.fields[`verifyEmail${singularName}`] = {
                    type: graphql_1.GraphQLBoolean,
                    args: {
                        token: { type: graphql_1.GraphQLString },
                    },
                    resolve: (0, verifyEmail_1.default)(collection),
                };
            }
        }
    });
}
exports.default = initCollectionsGraphQL;
//# sourceMappingURL=init.js.map