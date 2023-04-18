"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCollectionIDType = void 0;
/* eslint-disable no-use-before-define */
const graphql_1 = require("graphql");
const graphql_type_json_1 = require("graphql-type-json");
const withNullableType_1 = __importDefault(require("./withNullableType"));
const formatName_1 = __importDefault(require("../utilities/formatName"));
const combineParentName_1 = __importDefault(require("../utilities/combineParentName"));
const types_1 = require("../../fields/config/types");
const formatLabels_1 = require("../../utilities/formatLabels");
const groupOrTabHasRequiredSubfield_1 = require("../../utilities/groupOrTabHasRequiredSubfield");
const getCollectionIDType = (config) => {
    const idField = config.fields.find((field) => (0, types_1.fieldAffectsData)(field) && field.name === 'id');
    if (!idField)
        return graphql_1.GraphQLString;
    switch (idField.type) {
        case 'number':
            return graphql_1.GraphQLInt;
        default:
            return graphql_1.GraphQLString;
    }
};
exports.getCollectionIDType = getCollectionIDType;
function buildMutationInputType(payload, name, fields, parentName, forceNullable = false) {
    const fieldToSchemaMap = {
        number: (inputObjectTypeConfig, field) => {
            const type = field.name === 'id' ? graphql_1.GraphQLInt : graphql_1.GraphQLFloat;
            return {
                ...inputObjectTypeConfig,
                [field.name]: { type: (0, withNullableType_1.default)(field, type, forceNullable) },
            };
        },
        text: (inputObjectTypeConfig, field) => ({
            ...inputObjectTypeConfig,
            [field.name]: { type: (0, withNullableType_1.default)(field, graphql_1.GraphQLString, forceNullable) },
        }),
        email: (inputObjectTypeConfig, field) => ({
            ...inputObjectTypeConfig,
            [field.name]: { type: (0, withNullableType_1.default)(field, graphql_1.GraphQLString, forceNullable) },
        }),
        textarea: (inputObjectTypeConfig, field) => ({
            ...inputObjectTypeConfig,
            [field.name]: { type: (0, withNullableType_1.default)(field, graphql_1.GraphQLString, forceNullable) },
        }),
        richText: (inputObjectTypeConfig, field) => ({
            ...inputObjectTypeConfig,
            [field.name]: { type: (0, withNullableType_1.default)(field, graphql_type_json_1.GraphQLJSON, forceNullable) },
        }),
        code: (inputObjectTypeConfig, field) => ({
            ...inputObjectTypeConfig,
            [field.name]: { type: (0, withNullableType_1.default)(field, graphql_1.GraphQLString, forceNullable) },
        }),
        json: (inputObjectTypeConfig, field) => ({
            ...inputObjectTypeConfig,
            [field.name]: { type: (0, withNullableType_1.default)(field, graphql_type_json_1.GraphQLJSON, forceNullable) },
        }),
        date: (inputObjectTypeConfig, field) => ({
            ...inputObjectTypeConfig,
            [field.name]: { type: (0, withNullableType_1.default)(field, graphql_1.GraphQLString, forceNullable) },
        }),
        upload: (inputObjectTypeConfig, field) => ({
            ...inputObjectTypeConfig,
            [field.name]: { type: (0, withNullableType_1.default)(field, graphql_1.GraphQLString, forceNullable) },
        }),
        radio: (inputObjectTypeConfig, field) => ({
            ...inputObjectTypeConfig,
            [field.name]: { type: (0, withNullableType_1.default)(field, graphql_1.GraphQLString, forceNullable) },
        }),
        point: (inputObjectTypeConfig, field) => ({
            ...inputObjectTypeConfig,
            [field.name]: { type: (0, withNullableType_1.default)(field, new graphql_1.GraphQLList(graphql_1.GraphQLFloat), forceNullable) },
        }),
        checkbox: (inputObjectTypeConfig, field) => ({
            ...inputObjectTypeConfig,
            [field.name]: { type: graphql_1.GraphQLBoolean },
        }),
        select: (inputObjectTypeConfig, field) => {
            const formattedName = `${(0, combineParentName_1.default)(parentName, field.name)}_MutationInput`;
            let type = new graphql_1.GraphQLEnumType({
                name: formattedName,
                values: field.options.reduce((values, option) => {
                    if (typeof option === 'object' && option.value) {
                        return {
                            ...values,
                            [(0, formatName_1.default)(option.value)]: {
                                value: option.value,
                            },
                        };
                    }
                    if (typeof option === 'string') {
                        return {
                            ...values,
                            [option]: {
                                value: option,
                            },
                        };
                    }
                    return values;
                }, {}),
            });
            type = field.hasMany ? new graphql_1.GraphQLList(type) : type;
            type = (0, withNullableType_1.default)(field, type, forceNullable);
            return {
                ...inputObjectTypeConfig,
                [field.name]: { type },
            };
        },
        relationship: (inputObjectTypeConfig, field) => {
            const { relationTo } = field;
            let type;
            if (Array.isArray(relationTo)) {
                const fullName = `${(0, combineParentName_1.default)(parentName, (0, formatLabels_1.toWords)(field.name, true))}RelationshipInput`;
                type = new graphql_1.GraphQLInputObjectType({
                    name: fullName,
                    fields: {
                        relationTo: {
                            type: new graphql_1.GraphQLEnumType({
                                name: `${fullName}RelationTo`,
                                values: relationTo.reduce((values, option) => ({
                                    ...values,
                                    [(0, formatName_1.default)(option)]: {
                                        value: option,
                                    },
                                }), {}),
                            }),
                        },
                        value: { type: graphql_type_json_1.GraphQLJSON },
                    },
                });
            }
            else {
                type = (0, exports.getCollectionIDType)(payload.collections[relationTo].config);
            }
            return {
                ...inputObjectTypeConfig,
                [field.name]: { type: field.hasMany ? new graphql_1.GraphQLList(type) : type },
            };
        },
        array: (inputObjectTypeConfig, field) => {
            const fullName = (0, combineParentName_1.default)(parentName, (0, formatLabels_1.toWords)(field.name, true));
            let type = buildMutationInputType(payload, fullName, field.fields, fullName);
            type = new graphql_1.GraphQLList((0, withNullableType_1.default)(field, type, forceNullable));
            return {
                ...inputObjectTypeConfig,
                [field.name]: { type },
            };
        },
        group: (inputObjectTypeConfig, field) => {
            const requiresAtLeastOneField = (0, groupOrTabHasRequiredSubfield_1.groupOrTabHasRequiredSubfield)(field);
            const fullName = (0, combineParentName_1.default)(parentName, (0, formatLabels_1.toWords)(field.name, true));
            let type = buildMutationInputType(payload, fullName, field.fields, fullName);
            if (requiresAtLeastOneField)
                type = new graphql_1.GraphQLNonNull(type);
            return {
                ...inputObjectTypeConfig,
                [field.name]: { type },
            };
        },
        blocks: (inputObjectTypeConfig, field) => ({
            ...inputObjectTypeConfig,
            [field.name]: { type: graphql_type_json_1.GraphQLJSON },
        }),
        row: (inputObjectTypeConfig, field) => field.fields.reduce((acc, subField) => {
            const addSubField = fieldToSchemaMap[subField.type];
            if (addSubField)
                return addSubField(acc, subField);
            return acc;
        }, inputObjectTypeConfig),
        collapsible: (inputObjectTypeConfig, field) => field.fields.reduce((acc, subField) => {
            const addSubField = fieldToSchemaMap[subField.type];
            if (addSubField)
                return addSubField(acc, subField);
            return acc;
        }, inputObjectTypeConfig),
        tabs: (inputObjectTypeConfig, field) => {
            return field.tabs.reduce((acc, tab) => {
                if ((0, types_1.tabHasName)(tab)) {
                    const fullName = (0, combineParentName_1.default)(parentName, (0, formatLabels_1.toWords)(tab.name, true));
                    const requiresAtLeastOneField = (0, groupOrTabHasRequiredSubfield_1.groupOrTabHasRequiredSubfield)(field);
                    let type = buildMutationInputType(payload, fullName, tab.fields, fullName);
                    if (requiresAtLeastOneField)
                        type = new graphql_1.GraphQLNonNull(type);
                    return {
                        ...inputObjectTypeConfig,
                        [tab.name]: { type },
                    };
                }
                return {
                    ...acc,
                    ...tab.fields.reduce((subFieldSchema, subField) => {
                        const addSubField = fieldToSchemaMap[subField.type];
                        if (addSubField)
                            return addSubField(subFieldSchema, subField);
                        return subFieldSchema;
                    }, acc),
                };
            }, inputObjectTypeConfig);
        },
    };
    const fieldName = (0, formatName_1.default)(name);
    return new graphql_1.GraphQLInputObjectType({
        name: `mutation${fieldName}Input`,
        fields: fields.reduce((inputObjectTypeConfig, field) => {
            const fieldSchema = fieldToSchemaMap[field.type];
            if (typeof fieldSchema !== 'function') {
                return inputObjectTypeConfig;
            }
            return {
                ...inputObjectTypeConfig,
                ...fieldSchema(inputObjectTypeConfig, field),
            };
        }, {}),
    });
}
exports.default = buildMutationInputType;
//# sourceMappingURL=buildMutationInputType.js.map