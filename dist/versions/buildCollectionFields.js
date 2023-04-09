"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildVersionCollectionFields = void 0;
const buildVersionCollectionFields = (collection) => {
    var _a, _b, _c;
    const fields = [
        {
            name: 'parent',
            type: 'relationship',
            index: true,
            relationTo: collection.slug,
        },
        {
            name: 'version',
            type: 'group',
            fields: collection.fields,
        },
        {
            name: 'createdAt',
            type: 'date',
            index: true,
            admin: {
                disabled: true,
            },
        },
        {
            name: 'updatedAt',
            type: 'date',
            index: true,
            admin: {
                disabled: true,
            },
        },
    ];
    if (((_a = collection === null || collection === void 0 ? void 0 : collection.versions) === null || _a === void 0 ? void 0 : _a.drafts) && ((_c = (_b = collection === null || collection === void 0 ? void 0 : collection.versions) === null || _b === void 0 ? void 0 : _b.drafts) === null || _c === void 0 ? void 0 : _c.autosave)) {
        fields.push({
            name: 'autosave',
            type: 'checkbox',
            index: true,
        });
    }
    return fields;
};
exports.buildVersionCollectionFields = buildVersionCollectionFields;
//# sourceMappingURL=buildCollectionFields.js.map