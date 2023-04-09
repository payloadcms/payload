"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupOrTabHasRequiredSubfield = void 0;
const types_1 = require("../fields/config/types");
const groupOrTabHasRequiredSubfield = (entity) => {
    if ('type' in entity && entity.type === 'group') {
        return entity.fields.some((subField) => {
            return ((0, types_1.fieldAffectsData)(subField) && 'required' in subField && subField.required) || (0, exports.groupOrTabHasRequiredSubfield)(subField);
        });
    }
    if ('fields' in entity && 'name' in entity) {
        return entity.fields.some((subField) => (0, exports.groupOrTabHasRequiredSubfield)(subField));
    }
    return false;
};
exports.groupOrTabHasRequiredSubfield = groupOrTabHasRequiredSubfield;
//# sourceMappingURL=groupOrTabHasRequiredSubfield.js.map