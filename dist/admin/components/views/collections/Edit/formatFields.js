"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../../../../../fields/config/types");
const formatFields = (collection, isEditing) => (isEditing
    ? collection.fields.filter((field) => ((0, types_1.fieldAffectsData)(field) && field.name !== 'id') || true)
    : collection.fields);
exports.default = formatFields;
//# sourceMappingURL=formatFields.js.map