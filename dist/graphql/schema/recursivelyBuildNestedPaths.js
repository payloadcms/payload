"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../../fields/config/types");
const fieldToWhereInputSchemaMap_1 = __importDefault(require("./fieldToWhereInputSchemaMap"));
const recursivelyBuildNestedPaths = (parentName, field) => {
    const nestedPaths = field.fields.reduce((nestedFields, nestedField) => {
        if (!(0, types_1.fieldIsPresentationalOnly)(nestedField)) {
            const getFieldSchema = (0, fieldToWhereInputSchemaMap_1.default)(parentName)[nestedField.type];
            const nestedFieldName = (0, types_1.fieldAffectsData)(nestedField) ? `${field.name}__${nestedField.name}` : undefined;
            if (getFieldSchema) {
                const fieldSchema = getFieldSchema({
                    ...nestedField,
                    name: nestedFieldName,
                });
                if (Array.isArray(fieldSchema)) {
                    return [
                        ...nestedFields,
                        ...fieldSchema,
                    ];
                }
                return [
                    ...nestedFields,
                    {
                        key: nestedFieldName,
                        type: fieldSchema,
                    },
                ];
            }
        }
        return nestedFields;
    }, []);
    return nestedPaths;
};
exports.default = recursivelyBuildNestedPaths;
//# sourceMappingURL=recursivelyBuildNestedPaths.js.map