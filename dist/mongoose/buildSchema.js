"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-use-before-define */
const mongoose_1 = require("mongoose");
const types_1 = require("../fields/config/types");
const formatBaseSchema = (field, buildSchemaOptions) => {
    const { disableUnique, draftsEnabled, indexSortableFields } = buildSchemaOptions;
    const schema = {
        unique: (!disableUnique && field.unique) || false,
        required: false,
        index: field.index || (!disableUnique && field.unique) || indexSortableFields || false,
    };
    if ((schema.unique && (field.localized || draftsEnabled))) {
        schema.sparse = true;
    }
    if (field.hidden) {
        schema.hidden = true;
    }
    return schema;
};
const localizeSchema = (entity, schema, localization) => {
    if ((0, types_1.fieldIsLocalized)(entity) && localization && Array.isArray(localization.locales)) {
        return {
            type: localization.locales.reduce((localeSchema, locale) => ({
                ...localeSchema,
                [locale]: schema,
            }), {
                _id: false,
            }),
            localized: true,
        };
    }
    return schema;
};
const buildSchema = (config, configFields, buildSchemaOptions = {}) => {
    const { allowIDField, options } = buildSchemaOptions;
    let fields = {};
    let schemaFields = configFields;
    if (!allowIDField) {
        const idField = schemaFields.find((field) => (0, types_1.fieldAffectsData)(field) && field.name === 'id');
        if (idField) {
            fields = {
                _id: idField.type === 'number' ? Number : String,
            };
            schemaFields = schemaFields.filter((field) => !((0, types_1.fieldAffectsData)(field) && field.name === 'id'));
        }
    }
    const schema = new mongoose_1.Schema(fields, options);
    schemaFields.forEach((field) => {
        if (!(0, types_1.fieldIsPresentationalOnly)(field)) {
            const addFieldSchema = fieldToSchemaMap[field.type];
            if (addFieldSchema) {
                addFieldSchema(field, schema, config, buildSchemaOptions);
            }
        }
    });
    return schema;
};
const fieldToSchemaMap = {
    number: (field, schema, config, buildSchemaOptions) => {
        const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: Number };
        schema.add({
            [field.name]: localizeSchema(field, baseSchema, config.localization),
        });
    },
    text: (field, schema, config, buildSchemaOptions) => {
        const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: String };
        schema.add({
            [field.name]: localizeSchema(field, baseSchema, config.localization),
        });
    },
    email: (field, schema, config, buildSchemaOptions) => {
        const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: String };
        schema.add({
            [field.name]: localizeSchema(field, baseSchema, config.localization),
        });
    },
    textarea: (field, schema, config, buildSchemaOptions) => {
        const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: String };
        schema.add({
            [field.name]: localizeSchema(field, baseSchema, config.localization),
        });
    },
    richText: (field, schema, config, buildSchemaOptions) => {
        const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: mongoose_1.Schema.Types.Mixed };
        schema.add({
            [field.name]: localizeSchema(field, baseSchema, config.localization),
        });
    },
    code: (field, schema, config, buildSchemaOptions) => {
        const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: String };
        schema.add({
            [field.name]: localizeSchema(field, baseSchema, config.localization),
        });
    },
    json: (field, schema, config, buildSchemaOptions) => {
        const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: mongoose_1.Schema.Types.Mixed };
        schema.add({
            [field.name]: localizeSchema(field, baseSchema, config.localization),
        });
    },
    point: (field, schema, config, buildSchemaOptions) => {
        const baseSchema = {
            type: {
                type: String,
                enum: ['Point'],
            },
            coordinates: {
                type: [Number],
                required: false,
                default: field.defaultValue || undefined,
            },
        };
        if (buildSchemaOptions.disableUnique && field.unique && field.localized) {
            baseSchema.coordinates.sparse = true;
        }
        schema.add({
            [field.name]: localizeSchema(field, baseSchema, config.localization),
        });
        if (field.index === true || field.index === undefined) {
            const indexOptions = {};
            if (!buildSchemaOptions.disableUnique && field.unique) {
                indexOptions.sparse = true;
                indexOptions.unique = true;
            }
            if (field.localized && config.localization) {
                config.localization.locales.forEach((locale) => {
                    schema.index({ [`${field.name}.${locale}`]: '2dsphere' }, indexOptions);
                });
            }
            else {
                schema.index({ [field.name]: '2dsphere' }, indexOptions);
            }
        }
    },
    radio: (field, schema, config, buildSchemaOptions) => {
        const baseSchema = {
            ...formatBaseSchema(field, buildSchemaOptions),
            type: String,
            enum: field.options.map((option) => {
                if (typeof option === 'object')
                    return option.value;
                return option;
            }),
        };
        schema.add({
            [field.name]: localizeSchema(field, baseSchema, config.localization),
        });
    },
    checkbox: (field, schema, config, buildSchemaOptions) => {
        const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: Boolean };
        schema.add({
            [field.name]: localizeSchema(field, baseSchema, config.localization),
        });
    },
    date: (field, schema, config, buildSchemaOptions) => {
        const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: Date };
        schema.add({
            [field.name]: localizeSchema(field, baseSchema, config.localization),
        });
    },
    upload: (field, schema, config, buildSchemaOptions) => {
        const baseSchema = {
            ...formatBaseSchema(field, buildSchemaOptions),
            type: mongoose_1.Schema.Types.Mixed,
            ref: field.relationTo,
        };
        schema.add({
            [field.name]: localizeSchema(field, baseSchema, config.localization),
        });
    },
    relationship: (field, schema, config, buildSchemaOptions) => {
        const hasManyRelations = Array.isArray(field.relationTo);
        let schemaToReturn = {};
        if (field.localized && config.localization) {
            schemaToReturn = {
                type: config.localization.locales.reduce((locales, locale) => {
                    let localeSchema = {};
                    if (hasManyRelations) {
                        localeSchema = {
                            ...formatBaseSchema(field, buildSchemaOptions),
                            type: mongoose_1.Schema.Types.Mixed,
                            _id: false,
                            value: {
                                type: mongoose_1.Schema.Types.Mixed,
                                refPath: `${field.name}.${locale}.relationTo`,
                            },
                            relationTo: { type: String, enum: field.relationTo },
                        };
                    }
                    else {
                        localeSchema = {
                            ...formatBaseSchema(field, buildSchemaOptions),
                            type: mongoose_1.Schema.Types.Mixed,
                            ref: field.relationTo,
                        };
                    }
                    return {
                        ...locales,
                        [locale]: field.hasMany ? { type: [localeSchema], default: undefined } : localeSchema,
                    };
                }, {}),
                localized: true,
            };
        }
        else if (hasManyRelations) {
            schemaToReturn = {
                ...formatBaseSchema(field, buildSchemaOptions),
                type: mongoose_1.Schema.Types.Mixed,
                _id: false,
                value: {
                    type: mongoose_1.Schema.Types.Mixed,
                    refPath: `${field.name}.relationTo`,
                },
                relationTo: { type: String, enum: field.relationTo },
            };
            if (field.hasMany) {
                schemaToReturn = {
                    type: [schemaToReturn],
                    default: undefined,
                };
            }
        }
        else {
            schemaToReturn = {
                ...formatBaseSchema(field, buildSchemaOptions),
                type: mongoose_1.Schema.Types.Mixed,
                ref: field.relationTo,
            };
            if (field.hasMany) {
                schemaToReturn = {
                    type: [schemaToReturn],
                    default: undefined,
                };
            }
        }
        schema.add({
            [field.name]: schemaToReturn,
        });
    },
    row: (field, schema, config, buildSchemaOptions) => {
        field.fields.forEach((subField) => {
            const addFieldSchema = fieldToSchemaMap[subField.type];
            if (addFieldSchema) {
                addFieldSchema(subField, schema, config, buildSchemaOptions);
            }
        });
    },
    collapsible: (field, schema, config, buildSchemaOptions) => {
        field.fields.forEach((subField) => {
            const addFieldSchema = fieldToSchemaMap[subField.type];
            if (addFieldSchema) {
                addFieldSchema(subField, schema, config, buildSchemaOptions);
            }
        });
    },
    tabs: (field, schema, config, buildSchemaOptions) => {
        field.tabs.forEach((tab) => {
            if ((0, types_1.tabHasName)(tab)) {
                const baseSchema = {
                    type: buildSchema(config, tab.fields, {
                        options: {
                            _id: false,
                            id: false,
                            minimize: false,
                        },
                        disableUnique: buildSchemaOptions.disableUnique,
                        draftsEnabled: buildSchemaOptions.draftsEnabled,
                    }),
                };
                schema.add({
                    [tab.name]: localizeSchema(tab, baseSchema, config.localization),
                });
            }
            else {
                tab.fields.forEach((subField) => {
                    const addFieldSchema = fieldToSchemaMap[subField.type];
                    if (addFieldSchema) {
                        addFieldSchema(subField, schema, config, buildSchemaOptions);
                    }
                });
            }
        });
    },
    array: (field, schema, config, buildSchemaOptions) => {
        const baseSchema = {
            ...formatBaseSchema(field, buildSchemaOptions),
            default: undefined,
            type: [buildSchema(config, field.fields, {
                    options: {
                        _id: false,
                        id: false,
                        minimize: false,
                    },
                    allowIDField: true,
                    disableUnique: buildSchemaOptions.disableUnique,
                    draftsEnabled: buildSchemaOptions.draftsEnabled,
                })],
        };
        schema.add({
            [field.name]: localizeSchema(field, baseSchema, config.localization),
        });
    },
    group: (field, schema, config, buildSchemaOptions) => {
        const formattedBaseSchema = formatBaseSchema(field, buildSchemaOptions);
        const baseSchema = {
            ...formattedBaseSchema,
            type: buildSchema(config, field.fields, {
                options: {
                    _id: false,
                    id: false,
                    minimize: false,
                },
                disableUnique: buildSchemaOptions.disableUnique,
                draftsEnabled: buildSchemaOptions.draftsEnabled,
            }),
        };
        schema.add({
            [field.name]: localizeSchema(field, baseSchema, config.localization),
        });
    },
    select: (field, schema, config, buildSchemaOptions) => {
        const baseSchema = {
            ...formatBaseSchema(field, buildSchemaOptions),
            type: String,
            enum: field.options.map((option) => {
                if (typeof option === 'object')
                    return option.value;
                return option;
            }),
        };
        if (buildSchemaOptions.draftsEnabled || !field.required) {
            baseSchema.enum.push(null);
        }
        schema.add({
            [field.name]: localizeSchema(field, field.hasMany ? [baseSchema] : baseSchema, config.localization),
        });
    },
    blocks: (field, schema, config, buildSchemaOptions) => {
        const fieldSchema = {
            default: undefined,
            type: [new mongoose_1.Schema({}, { _id: false, discriminatorKey: 'blockType' })],
        };
        schema.add({
            [field.name]: localizeSchema(field, fieldSchema, config.localization),
        });
        field.blocks.forEach((blockItem) => {
            const blockSchema = new mongoose_1.Schema({}, { _id: false, id: false });
            blockItem.fields.forEach((blockField) => {
                const addFieldSchema = fieldToSchemaMap[blockField.type];
                if (addFieldSchema) {
                    addFieldSchema(blockField, blockSchema, config, buildSchemaOptions);
                }
            });
            if (field.localized && config.localization) {
                config.localization.locales.forEach((locale) => {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore Possible incorrect typing in mongoose types, this works
                    schema.path(`${field.name}.${locale}`).discriminator(blockItem.slug, blockSchema);
                });
            }
            else {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore Possible incorrect typing in mongoose types, this works
                schema.path(field.name).discriminator(blockItem.slug, blockSchema);
            }
        });
    },
};
exports.default = buildSchema;
//# sourceMappingURL=buildSchema.js.map