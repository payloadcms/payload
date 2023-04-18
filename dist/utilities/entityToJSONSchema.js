"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEntityObject = exports.entityToJSONSchema = void 0;
const pluralize_1 = require("pluralize");
const types_1 = require("../fields/config/types");
const deepCopyObject_1 = __importDefault(require("./deepCopyObject"));
const formatLabels_1 = require("./formatLabels");
const propertyIsRequired = (field) => {
    var _a, _b;
    if ((0, types_1.fieldAffectsData)(field) && (('required' in field && field.required === true)))
        return true;
    if ('fields' in field) {
        if (((_a = field.admin) === null || _a === void 0 ? void 0 : _a.condition) || ((_b = field.access) === null || _b === void 0 ? void 0 : _b.read))
            return false;
        return field.fields.find((subField) => propertyIsRequired(subField));
    }
    if (field.type === 'tabs') {
        return field.tabs.some((tab) => 'name' in tab && tab.fields.find((subField) => propertyIsRequired(subField)));
    }
    return false;
};
function getCollectionIDType(collections, slug) {
    const matchedCollection = collections.find((collection) => collection.slug === slug);
    const customIdField = matchedCollection.fields.find((field) => 'name' in field && field.name === 'id');
    if (customIdField && customIdField.type === 'number') {
        return 'number';
    }
    return 'string';
}
function returnOptionEnums(options) {
    return options.map((option) => {
        if (typeof option === 'object' && 'value' in option) {
            return option.value;
        }
        return option;
    });
}
function generateFieldTypes(config, fields) {
    let topLevelProps = [];
    let requiredTopLevelProps = [];
    return {
        properties: Object.fromEntries(fields.reduce((properties, field) => {
            let fieldSchema;
            switch (field.type) {
                case 'text':
                case 'textarea':
                case 'code':
                case 'email':
                case 'date': {
                    fieldSchema = { type: 'string' };
                    break;
                }
                case 'number': {
                    fieldSchema = { type: 'number' };
                    break;
                }
                case 'checkbox': {
                    fieldSchema = { type: 'boolean' };
                    break;
                }
                case 'json': {
                    // https://www.rfc-editor.org/rfc/rfc7159#section-3
                    fieldSchema = {
                        oneOf: [
                            { type: 'object' },
                            { type: 'array' },
                            { type: 'string' },
                            { type: 'number' },
                            { type: 'boolean' },
                            { type: 'null' },
                        ],
                    };
                    break;
                }
                case 'richText': {
                    fieldSchema = {
                        type: 'array',
                        items: {
                            type: 'object',
                        },
                    };
                    break;
                }
                case 'radio': {
                    fieldSchema = {
                        type: 'string',
                        enum: returnOptionEnums(field.options),
                    };
                    break;
                }
                case 'select': {
                    const selectType = {
                        type: 'string',
                        enum: returnOptionEnums(field.options),
                    };
                    if (field.hasMany) {
                        fieldSchema = {
                            type: 'array',
                            items: selectType,
                        };
                    }
                    else {
                        fieldSchema = selectType;
                    }
                    break;
                }
                case 'point': {
                    fieldSchema = {
                        type: 'array',
                        minItems: 2,
                        maxItems: 2,
                        items: [
                            {
                                type: 'number',
                            },
                            {
                                type: 'number',
                            },
                        ],
                    };
                    break;
                }
                case 'relationship': {
                    if (Array.isArray(field.relationTo)) {
                        if (field.hasMany) {
                            fieldSchema = {
                                oneOf: [
                                    {
                                        type: 'array',
                                        items: {
                                            oneOf: field.relationTo.map((relation) => {
                                                const idFieldType = getCollectionIDType(config.collections, relation);
                                                return {
                                                    type: 'object',
                                                    additionalProperties: false,
                                                    properties: {
                                                        value: {
                                                            type: idFieldType,
                                                        },
                                                        relationTo: {
                                                            const: relation,
                                                        },
                                                    },
                                                    required: ['value', 'relationTo'],
                                                };
                                            }),
                                        },
                                    },
                                    {
                                        type: 'array',
                                        items: {
                                            oneOf: field.relationTo.map((relation) => {
                                                return {
                                                    type: 'object',
                                                    additionalProperties: false,
                                                    properties: {
                                                        value: {
                                                            $ref: `#/definitions/${relation}`,
                                                        },
                                                        relationTo: {
                                                            const: relation,
                                                        },
                                                    },
                                                    required: ['value', 'relationTo'],
                                                };
                                            }),
                                        },
                                    },
                                ],
                            };
                        }
                        else {
                            fieldSchema = {
                                oneOf: field.relationTo.map((relation) => {
                                    const idFieldType = getCollectionIDType(config.collections, relation);
                                    return {
                                        type: 'object',
                                        additionalProperties: false,
                                        properties: {
                                            value: {
                                                oneOf: [
                                                    {
                                                        type: idFieldType,
                                                    },
                                                    {
                                                        $ref: `#/definitions/${relation}`,
                                                    },
                                                ],
                                            },
                                            relationTo: {
                                                const: relation,
                                            },
                                        },
                                        required: ['value', 'relationTo'],
                                    };
                                }),
                            };
                        }
                    }
                    else {
                        const idFieldType = getCollectionIDType(config.collections, field.relationTo);
                        if (field.hasMany) {
                            fieldSchema = {
                                oneOf: [
                                    {
                                        type: 'array',
                                        items: {
                                            type: idFieldType,
                                        },
                                    },
                                    {
                                        type: 'array',
                                        items: {
                                            $ref: `#/definitions/${field.relationTo}`,
                                        },
                                    },
                                ],
                            };
                        }
                        else {
                            fieldSchema = {
                                oneOf: [
                                    {
                                        type: idFieldType,
                                    },
                                    {
                                        $ref: `#/definitions/${field.relationTo}`,
                                    },
                                ],
                            };
                        }
                    }
                    break;
                }
                case 'upload': {
                    const idFieldType = getCollectionIDType(config.collections, field.relationTo);
                    fieldSchema = {
                        oneOf: [
                            {
                                type: idFieldType,
                            },
                            {
                                $ref: `#/definitions/${field.relationTo}`,
                            },
                        ],
                    };
                    break;
                }
                case 'blocks': {
                    fieldSchema = {
                        type: 'array',
                        items: {
                            oneOf: field.blocks.map((block) => {
                                const blockSchema = generateFieldTypes(config, block.fields);
                                return {
                                    type: 'object',
                                    additionalProperties: false,
                                    properties: {
                                        ...blockSchema.properties,
                                        blockType: {
                                            const: block.slug,
                                        },
                                    },
                                    required: [
                                        'blockType',
                                        ...blockSchema.required,
                                    ],
                                };
                            }),
                        },
                    };
                    break;
                }
                case 'array': {
                    fieldSchema = {
                        type: 'array',
                        items: {
                            type: 'object',
                            additionalProperties: false,
                            ...generateFieldTypes(config, field.fields),
                        },
                    };
                    break;
                }
                case 'row':
                case 'collapsible': {
                    const topLevelFields = generateFieldTypes(config, field.fields);
                    requiredTopLevelProps = requiredTopLevelProps.concat(topLevelFields.required);
                    topLevelProps = topLevelProps.concat(Object.entries(topLevelFields.properties).map((prop) => prop));
                    break;
                }
                case 'tabs': {
                    field.tabs.forEach((tab) => {
                        if ((0, types_1.tabHasName)(tab)) {
                            requiredTopLevelProps.push(tab.name);
                            topLevelProps.push([
                                tab.name,
                                {
                                    type: 'object',
                                    additionalProperties: false,
                                    ...generateFieldTypes(config, tab.fields),
                                },
                            ]);
                        }
                        else {
                            const topLevelFields = generateFieldTypes(config, tab.fields);
                            requiredTopLevelProps = requiredTopLevelProps.concat(topLevelFields.required);
                            topLevelProps = topLevelProps.concat(Object.entries(topLevelFields.properties).map((prop) => prop));
                        }
                    });
                    break;
                }
                case 'group': {
                    fieldSchema = {
                        type: 'object',
                        additionalProperties: false,
                        ...generateFieldTypes(config, field.fields),
                    };
                    break;
                }
                default: {
                    break;
                }
            }
            if (fieldSchema && (0, types_1.fieldAffectsData)(field)) {
                return [
                    ...properties,
                    [
                        field.name,
                        {
                            ...fieldSchema,
                        },
                    ],
                ];
            }
            return [
                ...properties,
                ...topLevelProps,
            ];
        }, [])),
        required: [
            ...fields
                .filter(propertyIsRequired)
                .map((field) => ((0, types_1.fieldAffectsData)(field) ? field.name : '')),
            ...requiredTopLevelProps,
        ],
    };
}
function entityToJSONSchema(config, incomingEntity) {
    var _a, _b;
    const entity = (0, deepCopyObject_1.default)(incomingEntity);
    const title = ((_a = entity.typescript) === null || _a === void 0 ? void 0 : _a.interface) ? entity.typescript.interface : (0, pluralize_1.singular)((0, formatLabels_1.toWords)(entity.slug, true));
    const idField = { type: 'text', name: 'id', required: true };
    const customIdField = entity.fields.find((field) => (0, types_1.fieldAffectsData)(field) && field.name === 'id');
    if (customIdField && customIdField.type !== 'group' && customIdField.type !== 'tab') {
        customIdField.required = true;
    }
    else {
        entity.fields.unshift(idField);
    }
    if ('timestamps' in entity && entity.timestamps !== false) {
        entity.fields.push({
            type: 'text',
            name: 'createdAt',
            required: true,
        }, {
            type: 'text',
            name: 'updatedAt',
            required: true,
        });
    }
    if ('auth' in entity && entity.auth && !((_b = entity.auth) === null || _b === void 0 ? void 0 : _b.disableLocalStrategy)) {
        entity.fields.push({
            type: 'text',
            name: 'password',
        });
    }
    return {
        title,
        type: 'object',
        additionalProperties: false,
        ...generateFieldTypes(config, entity.fields),
    };
}
exports.entityToJSONSchema = entityToJSONSchema;
function generateEntityObject(config, type) {
    return {
        type: 'object',
        properties: Object.fromEntries(config[type].map(({ slug }) => [
            slug,
            {
                $ref: `#/definitions/${slug}`,
            },
        ])),
        required: config[type].map(({ slug }) => slug),
        additionalProperties: false,
    };
}
exports.generateEntityObject = generateEntityObject;
//# sourceMappingURL=entityToJSONSchema.js.map