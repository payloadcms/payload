"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../../fields/config/types");
const isFieldNullable = (field, force) => {
    const hasReadAccessControl = field.access && field.access.read;
    const condition = field.admin && field.admin.condition;
    return !(force && (0, types_1.fieldAffectsData)(field) && 'required' in field && field.required && !field.localized && !condition && !hasReadAccessControl);
};
exports.default = isFieldNullable;
//# sourceMappingURL=isFieldNullable.js.map