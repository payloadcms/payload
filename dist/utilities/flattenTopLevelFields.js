"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../fields/config/types");
const flattenFields = (fields, keepPresentationalFields) => {
    return fields.reduce((fieldsToUse, field) => {
        if ((0, types_1.fieldAffectsData)(field) || (keepPresentationalFields && (0, types_1.fieldIsPresentationalOnly)(field))) {
            return [
                ...fieldsToUse,
                field,
            ];
        }
        if ((0, types_1.fieldHasSubFields)(field)) {
            return [
                ...fieldsToUse,
                ...flattenFields(field.fields, keepPresentationalFields),
            ];
        }
        if (field.type === 'tabs') {
            return [
                ...fieldsToUse,
                ...field.tabs.reduce((tabFields, tab) => {
                    return [
                        ...tabFields,
                        ...((0, types_1.tabHasName)(tab) ? [{ ...tab, type: 'tab' }] : flattenFields(tab.fields, keepPresentationalFields)),
                    ];
                }, []),
            ];
        }
        return fieldsToUse;
    }, []);
};
exports.default = flattenFields;
//# sourceMappingURL=flattenTopLevelFields.js.map