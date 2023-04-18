"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildVersionGlobalFields = void 0;
const buildVersionGlobalFields = (global) => {
    var _a, _b, _c;
    const fields = [
        {
            name: 'version',
            type: 'group',
            fields: global.fields,
        },
        {
            name: 'createdAt',
            type: 'date',
            admin: {
                disabled: true,
            },
        },
        {
            name: 'updatedAt',
            type: 'date',
            admin: {
                disabled: true,
            },
        },
    ];
    if (((_a = global === null || global === void 0 ? void 0 : global.versions) === null || _a === void 0 ? void 0 : _a.drafts) && ((_c = (_b = global === null || global === void 0 ? void 0 : global.versions) === null || _b === void 0 ? void 0 : _b.drafts) === null || _c === void 0 ? void 0 : _c.autosave)) {
        fields.push({
            name: 'autosave',
            type: 'checkbox',
            index: true,
        });
    }
    return fields;
};
exports.buildVersionGlobalFields = buildVersionGlobalFields;
//# sourceMappingURL=buildGlobalFields.js.map