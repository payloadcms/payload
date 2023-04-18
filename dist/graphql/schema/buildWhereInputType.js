"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-use-before-define */
const graphql_1 = require("graphql");
const graphql_type_json_1 = require("graphql-type-json");
const types_1 = require("../../fields/config/types");
const formatName_1 = __importDefault(require("../utilities/formatName"));
const withOperators_1 = __importDefault(require("./withOperators"));
const operators_1 = __importDefault(require("./operators"));
const fieldToWhereInputSchemaMap_1 = __importDefault(require("./fieldToWhereInputSchemaMap"));
// buildWhereInputType is similar to buildObjectType and operates
// on a field basis with a few distinct differences.
//
// 1. Everything needs to be a GraphQLInputObjectType or scalar / enum
// 2. Relationships, groups, repeaters and flex content are not
//    directly searchable. Instead, we need to build a chained pathname
//    using dot notation so Mongo can properly search nested paths.
const buildWhereInputType = (name, fields, parentName) => {
    // This is the function that builds nested paths for all
    // field types with nested paths.
    const fieldTypes = fields.reduce((schema, field) => {
        if (!(0, types_1.fieldIsPresentationalOnly)(field) && !field.hidden) {
            const getFieldSchema = (0, fieldToWhereInputSchemaMap_1.default)(parentName)[field.type];
            if (getFieldSchema) {
                const fieldSchema = getFieldSchema(field);
                if ((0, types_1.fieldHasSubFields)(field) || field.type === 'tabs') {
                    return {
                        ...schema,
                        ...(fieldSchema.reduce((subFields, subField) => ({
                            ...subFields,
                            [(0, formatName_1.default)(subField.key)]: subField.type,
                        }), {})),
                    };
                }
                return {
                    ...schema,
                    [(0, formatName_1.default)(field.name)]: fieldSchema,
                };
            }
        }
        return schema;
    }, {});
    fieldTypes.id = {
        type: (0, withOperators_1.default)({ name: 'id' }, graphql_type_json_1.GraphQLJSON, parentName, [...operators_1.default.equality, ...operators_1.default.contains]),
    };
    const fieldName = (0, formatName_1.default)(name);
    return new graphql_1.GraphQLInputObjectType({
        name: `${fieldName}_where`,
        fields: {
            ...fieldTypes,
            OR: {
                type: new graphql_1.GraphQLList(new graphql_1.GraphQLInputObjectType({
                    name: `${fieldName}_where_or`,
                    fields: fieldTypes,
                })),
            },
            AND: {
                type: new graphql_1.GraphQLList(new graphql_1.GraphQLInputObjectType({
                    name: `${fieldName}_where_and`,
                    fields: fieldTypes,
                })),
            },
        },
    });
};
exports.default = buildWhereInputType;
//# sourceMappingURL=buildWhereInputType.js.map