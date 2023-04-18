"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBaseFields = void 0;
const extractTranslations_1 = require("../../../../../../../../translations/extractTranslations");
const translations = (0, extractTranslations_1.extractTranslations)([
    'fields:textToDisplay',
    'fields:linkType',
    'fields:chooseBetweenCustomTextOrDocument',
    'fields:customURL',
    'fields:internalLink',
    'fields:enterURL',
    'fields:chooseDocumentToLink',
    'fields:openInNewTab',
]);
const getBaseFields = (config) => [
    {
        name: 'text',
        label: translations['fields:textToDisplay'],
        type: 'text',
        required: true,
    },
    {
        name: 'linkType',
        label: translations['fields:linkType'],
        type: 'radio',
        required: true,
        admin: {
            description: translations['fields:chooseBetweenCustomTextOrDocument'],
        },
        defaultValue: 'custom',
        options: [
            {
                label: translations['fields:customURL'],
                value: 'custom',
            },
            {
                label: translations['fields:internalLink'],
                value: 'internal',
            },
        ],
    },
    {
        name: 'url',
        label: translations['fields:enterURL'],
        type: 'text',
        required: true,
        admin: {
            condition: ({ linkType, url }) => {
                return (typeof linkType === 'undefined' && url) || linkType === 'custom';
            },
        },
    },
    {
        name: 'doc',
        label: translations['fields:chooseDocumentToLink'],
        type: 'relationship',
        required: true,
        relationTo: config.collections.map(({ slug }) => slug),
        admin: {
            condition: ({ linkType }) => {
                return linkType === 'internal';
            },
        },
    },
    {
        name: 'newTab',
        label: translations['fields:openInNewTab'],
        type: 'checkbox',
    },
];
exports.getBaseFields = getBaseFields;
//# sourceMappingURL=baseFields.js.map