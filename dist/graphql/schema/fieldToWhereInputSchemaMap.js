"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const graphql_scalars_1 = require("graphql-scalars");
const graphql_type_json_1 = require("graphql-type-json");
const types_1 = require("../../fields/config/types");
const withOperators_1 = __importDefault(require("./withOperators"));
const operators_1 = __importDefault(require("./operators"));
const combineParentName_1 = __importDefault(require("../utilities/combineParentName"));
const formatName_1 = __importDefault(require("../utilities/formatName"));
const recursivelyBuildNestedPaths_1 = __importDefault(require("./recursivelyBuildNestedPaths"));
const fieldToSchemaMap = (parentName) => ({
    number: (field) => {
        const type = graphql_1.GraphQLFloat;
        return {
            type: (0, withOperators_1.default)(field, type, parentName, [...operators_1.default.equality, ...operators_1.default.comparison]),
        };
    },
    text: (field) => {
        const type = graphql_1.GraphQLString;
        return {
            type: (0, withOperators_1.default)(field, type, parentName, [...operators_1.default.equality, ...operators_1.default.partial, ...operators_1.default.contains]),
        };
    },
    email: (field) => {
        const type = graphql_scalars_1.EmailAddressResolver;
        return {
            type: (0, withOperators_1.default)(field, type, parentName, [...operators_1.default.equality, ...operators_1.default.partial, ...operators_1.default.contains]),
        };
    },
    textarea: (field) => {
        const type = graphql_1.GraphQLString;
        return {
            type: (0, withOperators_1.default)(field, type, parentName, [...operators_1.default.equality, ...operators_1.default.partial]),
        };
    },
    richText: (field) => {
        const type = graphql_type_json_1.GraphQLJSON;
        return {
            type: (0, withOperators_1.default)(field, type, parentName, [...operators_1.default.equality, ...operators_1.default.partial]),
        };
    },
    json: (field) => {
        const type = graphql_type_json_1.GraphQLJSON;
        return {
            type: (0, withOperators_1.default)(field, type, parentName, [...operators_1.default.equality, ...operators_1.default.partial]),
        };
    },
    code: (field) => {
        const type = graphql_1.GraphQLString;
        return {
            type: (0, withOperators_1.default)(field, type, parentName, [...operators_1.default.equality, ...operators_1.default.partial]),
        };
    },
    radio: (field) => ({
        type: (0, withOperators_1.default)(field, new graphql_1.GraphQLEnumType({
            name: `${(0, combineParentName_1.default)(parentName, field.name)}_Input`,
            values: field.options.reduce((values, option) => {
                if ((0, types_1.optionIsObject)(option)) {
                    return {
                        ...values,
                        [(0, formatName_1.default)(option.value)]: {
                            value: option.value,
                        },
                    };
                }
                return {
                    ...values,
                    [(0, formatName_1.default)(option)]: {
                        value: option,
                    },
                };
            }, {}),
        }), parentName, [...operators_1.default.equality, ...operators_1.default.contains]),
    }),
    date: (field) => {
        const type = graphql_scalars_1.DateTimeResolver;
        return {
            type: (0, withOperators_1.default)(field, type, parentName, [...operators_1.default.equality, ...operators_1.default.comparison, 'like']),
        };
    },
    point: (field) => {
        const type = new graphql_1.GraphQLList(graphql_1.GraphQLFloat);
        return {
            type: (0, withOperators_1.default)(field, type, parentName, [...operators_1.default.equality, ...operators_1.default.comparison, ...operators_1.default.geo]),
        };
    },
    relationship: (field) => {
        let type = (0, withOperators_1.default)(field, graphql_1.GraphQLString, parentName, [...operators_1.default.equality, ...operators_1.default.contains]);
        if (Array.isArray(field.relationTo)) {
            type = new graphql_1.GraphQLInputObjectType({
                name: `${(0, combineParentName_1.default)(parentName, field.name)}_Relation`,
                fields: {
                    relationTo: {
                        type: new graphql_1.GraphQLEnumType({
                            name: `${(0, combineParentName_1.default)(parentName, field.name)}_Relation_RelationTo`,
                            values: field.relationTo.reduce((values, relation) => ({
                                ...values,
                                [(0, formatName_1.default)(relation)]: {
                                    value: relation,
                                },
                            }), {}),
                        }),
                    },
                    value: { type: graphql_1.GraphQLString },
                },
            });
        }
        return { type };
    },
    upload: (field) => ({
        type: (0, withOperators_1.default)(field, graphql_1.GraphQLString, parentName, [...operators_1.default.equality]),
    }),
    checkbox: (field) => ({
        type: (0, withOperators_1.default)(field, graphql_1.GraphQLBoolean, parentName, [...operators_1.default.equality]),
    }),
    select: (field) => ({
        type: (0, withOperators_1.default)(field, new graphql_1.GraphQLEnumType({
            name: `${(0, combineParentName_1.default)(parentName, field.name)}_Input`,
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
        }), parentName, [...operators_1.default.equality, ...operators_1.default.contains]),
    }),
    array: (field) => (0, recursivelyBuildNestedPaths_1.default)(parentName, field),
    group: (field) => (0, recursivelyBuildNestedPaths_1.default)(parentName, field),
    row: (field) => field.fields.reduce((rowSchema, subField) => {
        const getFieldSchema = fieldToSchemaMap(parentName)[subField.type];
        if (getFieldSchema) {
            const rowFieldSchema = getFieldSchema(subField);
            if ((0, types_1.fieldHasSubFields)(subField)) {
                return [
                    ...rowSchema,
                    ...rowFieldSchema,
                ];
            }
            if ((0, types_1.fieldAffectsData)(subField)) {
                return [
                    ...rowSchema,
                    {
                        key: subField.name,
                        type: rowFieldSchema,
                    },
                ];
            }
        }
        return rowSchema;
    }, []),
    collapsible: (field) => field.fields.reduce((rowSchema, subField) => {
        const getFieldSchema = fieldToSchemaMap(parentName)[subField.type];
        if (getFieldSchema) {
            const rowFieldSchema = getFieldSchema(subField);
            if ((0, types_1.fieldHasSubFields)(subField)) {
                return [
                    ...rowSchema,
                    ...rowFieldSchema,
                ];
            }
            if ((0, types_1.fieldAffectsData)(subField)) {
                return [
                    ...rowSchema,
                    {
                        key: subField.name,
                        type: rowFieldSchema,
                    },
                ];
            }
        }
        return rowSchema;
    }, []),
    tabs: (field) => field.tabs.reduce((tabSchema, tab) => {
        return [
            ...tabSchema,
            ...tab.fields.reduce((rowSchema, subField) => {
                const getFieldSchema = fieldToSchemaMap(parentName)[subField.type];
                if (getFieldSchema) {
                    const rowFieldSchema = getFieldSchema(subField);
                    if ((0, types_1.fieldHasSubFields)(subField)) {
                        return [
                            ...rowSchema,
                            ...rowFieldSchema,
                        ];
                    }
                    if ((0, types_1.fieldAffectsData)(subField)) {
                        return [
                            ...rowSchema,
                            {
                                key: subField.name,
                                type: rowFieldSchema,
                            },
                        ];
                    }
                }
                return rowSchema;
            }, []),
        ];
    }, []),
});
exports.default = fieldToSchemaMap;
//# sourceMappingURL=fieldToWhereInputSchemaMap.js.map