"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-use-before-define */
const graphql_type_json_1 = require("graphql-type-json");
const graphql_1 = require("graphql");
const graphql_scalars_1 = require("graphql-scalars");
const types_1 = require("../../fields/config/types");
const formatName_1 = __importDefault(require("../utilities/formatName"));
const combineParentName_1 = __importDefault(require("../utilities/combineParentName"));
const withNullableType_1 = __importDefault(require("./withNullableType"));
const formatLabels_1 = require("../../utilities/formatLabels");
const richTextRelationshipPromise_1 = __importDefault(require("../../fields/richText/richTextRelationshipPromise"));
const formatOptions_1 = __importDefault(require("../utilities/formatOptions"));
const buildWhereInputType_1 = __importDefault(require("./buildWhereInputType"));
const buildBlockType_1 = __importDefault(require("./buildBlockType"));
const isFieldNullable_1 = __importDefault(require("./isFieldNullable"));
function buildObjectType({ payload, name, fields, parentName, baseFields = {}, forceNullable, }) {
    const fieldToSchemaMap = {
        number: (objectTypeConfig, field) => ({
            ...objectTypeConfig,
            [field.name]: { type: (0, withNullableType_1.default)(field, graphql_1.GraphQLFloat, forceNullable) },
        }),
        text: (objectTypeConfig, field) => ({
            ...objectTypeConfig,
            [field.name]: { type: (0, withNullableType_1.default)(field, graphql_1.GraphQLString, forceNullable) },
        }),
        email: (objectTypeConfig, field) => ({
            ...objectTypeConfig,
            [field.name]: { type: (0, withNullableType_1.default)(field, graphql_scalars_1.EmailAddressResolver, forceNullable) },
        }),
        textarea: (objectTypeConfig, field) => ({
            ...objectTypeConfig,
            [field.name]: { type: (0, withNullableType_1.default)(field, graphql_1.GraphQLString, forceNullable) },
        }),
        code: (objectTypeConfig, field) => ({
            ...objectTypeConfig,
            [field.name]: { type: (0, withNullableType_1.default)(field, graphql_1.GraphQLString, forceNullable) },
        }),
        json: (objectTypeConfig, field) => ({
            ...objectTypeConfig,
            [field.name]: { type: (0, withNullableType_1.default)(field, graphql_type_json_1.GraphQLJSON, forceNullable) },
        }),
        date: (objectTypeConfig, field) => ({
            ...objectTypeConfig,
            [field.name]: { type: (0, withNullableType_1.default)(field, graphql_scalars_1.DateTimeResolver, forceNullable) },
        }),
        point: (objectTypeConfig, field) => ({
            ...objectTypeConfig,
            [field.name]: { type: (0, withNullableType_1.default)(field, new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(graphql_1.GraphQLFloat)), forceNullable) },
        }),
        richText: (objectTypeConfig, field) => ({
            ...objectTypeConfig,
            [field.name]: {
                type: (0, withNullableType_1.default)(field, graphql_type_json_1.GraphQLJSON, forceNullable),
                async resolve(parent, args, context) {
                    let depth = payload.config.defaultDepth;
                    if (typeof args.depth !== 'undefined')
                        depth = args.depth;
                    if (depth > 0) {
                        await (0, richTextRelationshipPromise_1.default)({
                            req: context.req,
                            siblingDoc: parent,
                            depth,
                            field,
                            showHiddenFields: false,
                        });
                    }
                    return parent[field.name];
                },
                args: {
                    depth: {
                        type: graphql_1.GraphQLInt,
                    },
                },
            },
        }),
        upload: (objectTypeConfig, field) => {
            const { relationTo } = field;
            const uploadName = (0, combineParentName_1.default)(parentName, (0, formatLabels_1.toWords)(field.name, true));
            // If the relationshipType is undefined at this point,
            // it can be assumed that this blockType can have a relationship
            // to itself. Therefore, we set the relationshipType equal to the blockType
            // that is currently being created.
            const type = (0, withNullableType_1.default)(field, payload.collections[relationTo].graphQL.type || newlyCreatedBlockType, forceNullable);
            const uploadArgs = {};
            if (payload.config.localization) {
                uploadArgs.locale = {
                    type: payload.types.localeInputType,
                };
                uploadArgs.fallbackLocale = {
                    type: payload.types.fallbackLocaleInputType,
                };
            }
            const relatedCollectionSlug = field.relationTo;
            const upload = {
                args: uploadArgs,
                type,
                extensions: { complexity: 20 },
                async resolve(parent, args, context) {
                    const value = parent[field.name];
                    const locale = args.locale || context.req.locale;
                    const fallbackLocale = args.fallbackLocale || context.req.fallbackLocale;
                    const id = value;
                    if (id) {
                        const relatedDocument = await context.req.payloadDataLoader.load(JSON.stringify([
                            relatedCollectionSlug,
                            id,
                            0,
                            0,
                            locale,
                            fallbackLocale,
                            false,
                            false,
                        ]));
                        return relatedDocument || null;
                    }
                    return null;
                },
            };
            const whereFields = payload.collections[relationTo].config.fields;
            upload.args.where = {
                type: (0, buildWhereInputType_1.default)(uploadName, whereFields, uploadName),
            };
            return {
                ...objectTypeConfig,
                [field.name]: upload,
            };
        },
        radio: (objectTypeConfig, field) => ({
            ...objectTypeConfig,
            [field.name]: {
                type: (0, withNullableType_1.default)(field, new graphql_1.GraphQLEnumType({
                    name: (0, combineParentName_1.default)(parentName, field.name),
                    values: (0, formatOptions_1.default)(field),
                }), forceNullable),
            },
        }),
        checkbox: (objectTypeConfig, field) => ({
            ...objectTypeConfig,
            [field.name]: { type: (0, withNullableType_1.default)(field, graphql_1.GraphQLBoolean, forceNullable) },
        }),
        select: (objectTypeConfig, field) => {
            const fullName = (0, combineParentName_1.default)(parentName, field.name);
            let type = new graphql_1.GraphQLEnumType({
                name: fullName,
                values: (0, formatOptions_1.default)(field),
            });
            type = field.hasMany ? new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(type)) : type;
            type = (0, withNullableType_1.default)(field, type, forceNullable);
            return {
                ...objectTypeConfig,
                [field.name]: { type },
            };
        },
        relationship: (objectTypeConfig, field) => {
            const { relationTo } = field;
            const isRelatedToManyCollections = Array.isArray(relationTo);
            const hasManyValues = field.hasMany;
            const relationshipName = (0, combineParentName_1.default)(parentName, (0, formatLabels_1.toWords)(field.name, true));
            let type;
            let relationToType = null;
            if (Array.isArray(relationTo)) {
                relationToType = new graphql_1.GraphQLEnumType({
                    name: `${relationshipName}_RelationTo`,
                    values: relationTo.reduce((relations, relation) => ({
                        ...relations,
                        [(0, formatName_1.default)(relation)]: {
                            value: relation,
                        },
                    }), {}),
                });
                const types = relationTo.map((relation) => payload.collections[relation].graphQL.type);
                type = new graphql_1.GraphQLObjectType({
                    name: `${relationshipName}_Relationship`,
                    fields: {
                        relationTo: {
                            type: relationToType,
                        },
                        value: {
                            type: new graphql_1.GraphQLUnionType({
                                name: relationshipName,
                                types,
                                async resolveType(data, { req }) {
                                    return payload.collections[data.collection].graphQL.type.name;
                                },
                            }),
                        },
                    },
                });
            }
            else {
                ({ type } = payload.collections[relationTo].graphQL);
            }
            // If the relationshipType is undefined at this point,
            // it can be assumed that this blockType can have a relationship
            // to itself. Therefore, we set the relationshipType equal to the blockType
            // that is currently being created.
            type = type || newlyCreatedBlockType;
            const relationshipArgs = {};
            if (payload.config.localization) {
                relationshipArgs.locale = {
                    type: payload.types.localeInputType,
                };
                relationshipArgs.fallbackLocale = {
                    type: payload.types.fallbackLocaleInputType,
                };
            }
            const relationship = {
                args: relationshipArgs,
                type: (0, withNullableType_1.default)(field, hasManyValues ? new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(type)) : type, forceNullable),
                extensions: { complexity: 10 },
                async resolve(parent, args, context) {
                    const value = parent[field.name];
                    const locale = args.locale || context.req.locale;
                    const fallbackLocale = args.fallbackLocale || context.req.fallbackLocale;
                    let relatedCollectionSlug = field.relationTo;
                    if (hasManyValues) {
                        const results = [];
                        const resultPromises = [];
                        const createPopulationPromise = async (relatedDoc, i) => {
                            let id = relatedDoc;
                            let collectionSlug = field.relationTo;
                            if (isRelatedToManyCollections) {
                                collectionSlug = relatedDoc.relationTo;
                                id = relatedDoc.value;
                            }
                            const result = await context.req.payloadDataLoader.load(JSON.stringify([
                                collectionSlug,
                                id,
                                0,
                                0,
                                locale,
                                fallbackLocale,
                                false,
                                false,
                            ]));
                            if (result) {
                                if (isRelatedToManyCollections) {
                                    results[i] = {
                                        relationTo: collectionSlug,
                                        value: {
                                            ...result,
                                            collection: collectionSlug,
                                        },
                                    };
                                }
                                else {
                                    results[i] = result;
                                }
                            }
                        };
                        if (value) {
                            value.forEach((relatedDoc, i) => {
                                resultPromises.push(createPopulationPromise(relatedDoc, i));
                            });
                        }
                        await Promise.all(resultPromises);
                        return results;
                    }
                    let id = value;
                    if (isRelatedToManyCollections && value) {
                        id = value.value;
                        relatedCollectionSlug = value.relationTo;
                    }
                    if (id) {
                        id = id.toString();
                        const relatedDocument = await context.req.payloadDataLoader.load(JSON.stringify([
                            relatedCollectionSlug,
                            id,
                            0,
                            0,
                            locale,
                            fallbackLocale,
                            false,
                            false,
                        ]));
                        if (relatedDocument) {
                            if (isRelatedToManyCollections) {
                                return {
                                    relationTo: relatedCollectionSlug,
                                    value: {
                                        ...relatedDocument,
                                        collection: relatedCollectionSlug,
                                    },
                                };
                            }
                            return relatedDocument;
                        }
                        return null;
                    }
                    return null;
                },
            };
            return {
                ...objectTypeConfig,
                [field.name]: relationship,
            };
        },
        array: (objectTypeConfig, field) => {
            const fullName = (0, combineParentName_1.default)(parentName, (0, formatLabels_1.toWords)(field.name, true));
            const type = buildObjectType({
                payload,
                name: fullName,
                fields: field.fields,
                parentName: fullName,
                forceNullable: (0, isFieldNullable_1.default)(field, forceNullable),
            });
            const arrayType = new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(type));
            return {
                ...objectTypeConfig,
                [field.name]: { type: (0, withNullableType_1.default)(field, arrayType) },
            };
        },
        group: (objectTypeConfig, field) => {
            const fullName = (0, combineParentName_1.default)(parentName, (0, formatLabels_1.toWords)(field.name, true));
            const type = buildObjectType({
                payload,
                name: fullName,
                parentName: fullName,
                fields: field.fields,
                forceNullable: (0, isFieldNullable_1.default)(field, forceNullable),
            });
            return {
                ...objectTypeConfig,
                [field.name]: { type },
            };
        },
        blocks: (objectTypeConfig, field) => {
            const blockTypes = field.blocks.map((block) => {
                (0, buildBlockType_1.default)({
                    payload,
                    block,
                    forceNullable: (0, isFieldNullable_1.default)(field, forceNullable),
                });
                return payload.types.blockTypes[block.slug];
            });
            const fullName = (0, combineParentName_1.default)(parentName, (0, formatLabels_1.toWords)(field.name, true));
            const type = new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(new graphql_1.GraphQLUnionType({
                name: fullName,
                types: blockTypes,
                resolveType: (data) => payload.types.blockTypes[data.blockType].name,
            })));
            return {
                ...objectTypeConfig,
                [field.name]: { type: (0, withNullableType_1.default)(field, type) },
            };
        },
        row: (objectTypeConfig, field) => field.fields.reduce((objectTypeConfigWithRowFields, subField) => {
            const addSubField = fieldToSchemaMap[subField.type];
            if (addSubField)
                return addSubField(objectTypeConfigWithRowFields, subField);
            return objectTypeConfigWithRowFields;
        }, objectTypeConfig),
        collapsible: (objectTypeConfig, field) => field.fields.reduce((objectTypeConfigWithCollapsibleFields, subField) => {
            const addSubField = fieldToSchemaMap[subField.type];
            if (addSubField)
                return addSubField(objectTypeConfigWithCollapsibleFields, subField);
            return objectTypeConfigWithCollapsibleFields;
        }, objectTypeConfig),
        tabs: (objectTypeConfig, field) => field.tabs.reduce((tabSchema, tab) => {
            if ((0, types_1.tabHasName)(tab)) {
                const fullName = (0, combineParentName_1.default)(parentName, (0, formatLabels_1.toWords)(tab.name, true));
                const type = buildObjectType({
                    payload,
                    name: fullName,
                    parentName: fullName,
                    fields: tab.fields,
                    forceNullable,
                });
                return {
                    ...tabSchema,
                    [tab.name]: { type },
                };
            }
            return {
                ...tabSchema,
                ...tab.fields.reduce((subFieldSchema, subField) => {
                    const addSubField = fieldToSchemaMap[subField.type];
                    if (addSubField)
                        return addSubField(subFieldSchema, subField);
                    return subFieldSchema;
                }, tabSchema),
            };
        }, objectTypeConfig),
    };
    const objectSchema = {
        name,
        fields: () => fields.reduce((objectTypeConfig, field) => {
            const fieldSchema = fieldToSchemaMap[field.type];
            if (typeof fieldSchema !== 'function') {
                return objectTypeConfig;
            }
            return {
                ...objectTypeConfig,
                ...fieldSchema(objectTypeConfig, field),
            };
        }, baseFields),
    };
    const newlyCreatedBlockType = new graphql_1.GraphQLObjectType(objectSchema);
    return newlyCreatedBlockType;
}
exports.default = buildObjectType;
//# sourceMappingURL=buildObjectType.js.map