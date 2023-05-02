"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../../../../../fields/config/types");
const formatFields = (config, t) => {
    const hasID = config.fields.findIndex((field) => (0, types_1.fieldAffectsData)(field) && field.name === 'id') > -1;
    const fields = config.fields.reduce((formatted, field) => {
        var _a;
        if (!(0, types_1.fieldIsPresentationalOnly)(field) && (field.hidden === true || ((_a = field === null || field === void 0 ? void 0 : field.admin) === null || _a === void 0 ? void 0 : _a.disabled) === true)) {
            return formatted;
        }
        return [
            ...formatted,
            field,
        ];
    }, hasID ? [] : [{
            name: 'id',
            label: 'ID',
            type: 'text',
            admin: {
                disableBulkEdit: true,
            },
        }]);
    if (config.timestamps) {
        fields.push({
            name: 'createdAt',
            label: t('general:createdAt'),
            type: 'date',
            admin: {
                disableBulkEdit: true,
            },
        }, {
            name: 'updatedAt',
            label: t('general:updatedAt'),
            type: 'date',
            admin: {
                disableBulkEdit: true,
            },
        });
    }
    return fields;
};
exports.default = formatFields;
//# sourceMappingURL=formatFields.js.map