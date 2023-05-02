"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const deepmerge_1 = __importDefault(require("deepmerge"));
const types_1 = require("./config/types");
const mergeBaseFields = (fields, baseFields) => {
    const mergedFields = [...fields || []];
    baseFields.forEach((baseField) => {
        let matchedIndex = null;
        if ((0, types_1.fieldAffectsData)(baseField)) {
            const match = mergedFields.find((field, i) => {
                if ((0, types_1.fieldAffectsData)(field) && field.name === baseField.name) {
                    matchedIndex = i;
                    return true;
                }
                return false;
            });
            if (match) {
                const matchCopy = { ...match };
                mergedFields.splice(matchedIndex, 1);
                const mergedField = (0, deepmerge_1.default)(baseField, matchCopy);
                if ((0, types_1.fieldHasSubFields)(baseField) && (0, types_1.fieldHasSubFields)(matchCopy)) {
                    mergedField.fields = mergeBaseFields(matchCopy.fields, baseField.fields);
                }
                mergedFields.push(mergedField);
            }
            else {
                mergedFields.push(baseField);
            }
        }
    });
    return mergedFields;
};
exports.default = mergeBaseFields;
//# sourceMappingURL=mergeBaseFields.js.map