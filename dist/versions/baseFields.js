"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statuses = void 0;
const extractTranslations_1 = require("../translations/extractTranslations");
const labels = (0, extractTranslations_1.extractTranslations)(['version:draft', 'version:published', 'version:status']);
exports.statuses = [
    {
        label: labels['version:draft'],
        value: 'draft',
    },
    {
        label: labels['version:published'],
        value: 'published',
    },
];
const baseVersionFields = [
    {
        name: '_status',
        label: labels['version:status'],
        type: 'select',
        options: exports.statuses,
        defaultValue: 'draft',
        admin: {
            disableBulkEdit: true,
            components: {
                Field: () => null,
            },
        },
    },
];
exports.default = baseVersionFields;
//# sourceMappingURL=baseFields.js.map