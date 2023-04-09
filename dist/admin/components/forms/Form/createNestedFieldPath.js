"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNestedFieldPath = void 0;
const types_1 = require("../../../../fields/config/types");
const createNestedFieldPath = (parentPath, field) => {
    if (parentPath) {
        if ((0, types_1.fieldAffectsData)(field)) {
            return `${parentPath}.${field.name}`;
        }
        return parentPath;
    }
    if ((0, types_1.fieldAffectsData)(field)) {
        return field.name;
    }
    return '';
};
exports.createNestedFieldPath = createNestedFieldPath;
//# sourceMappingURL=createNestedFieldPath.js.map