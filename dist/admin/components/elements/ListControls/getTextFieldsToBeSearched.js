"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTextFieldsToBeSearched = void 0;
const types_1 = require("../../../../fields/config/types");
const flattenTopLevelFields_1 = __importDefault(require("../../../../utilities/flattenTopLevelFields"));
const getTextFieldsToBeSearched = (listSearchableFields, fields) => () => {
    if (listSearchableFields) {
        const flattenedFields = (0, flattenTopLevelFields_1.default)(fields);
        return flattenedFields.filter((field) => (0, types_1.fieldAffectsData)(field) && listSearchableFields.includes(field.name));
    }
    return null;
};
exports.getTextFieldsToBeSearched = getTextFieldsToBeSearched;
//# sourceMappingURL=getTextFieldsToBeSearched.js.map