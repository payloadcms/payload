import { MissingEditorProp } from '../errors/MissingEditorProp.js';
import { fieldAffectsData } from '../fields/config/types.js';
import { generateJobsJSONSchemas } from '../queues/config/generateJobsJSONSchemas.js';
import { formatNames } from './formatLabels.js';
import { getCollectionIDFieldTypes } from './getCollectionIDFieldTypes.js';
import { optionsAreEqual } from './optionsAreEqual.js';
const fieldIsRequired = (field)=>{
    const isConditional = Boolean(field?.admin && field?.admin?.condition);
    if (isConditional) {
        return false;
    }
    const isMarkedRequired = 'required' in field && field.required === true;
    if (fieldAffectsData(field) && isMarkedRequired) {
        return true;
    }
    // if any subfields are required, this field is required
    if ('fields' in field && field.type !== 'array') {
        return field.flattenedFields.some((subField)=>fieldIsRequired(subField));
    }
    return false;
};
function buildOptionEnums(options) {
    return options.map((option)=>{
        if (typeof option === 'object' && 'value' in option) {
            return option.value;
        }
        return option;
    });
}
function generateEntitySchemas(entities) {
    const properties = [
        ...entities
    ].reduce((acc, { slug })=>{
        acc[slug] = {
            $ref: `#/definitions/${slug}`
        };
        return acc;
    }, {});
    return {
        type: 'object',
        additionalProperties: false,
        properties,
        required: Object.keys(properties)
    };
}
function generateEntitySelectSchemas(entities) {
    const properties = [
        ...entities
    ].reduce((acc, { slug })=>{
        acc[slug] = {
            $ref: `#/definitions/${slug}_select`
        };
        return acc;
    }, {});
    return {
        type: 'object',
        additionalProperties: false,
        properties,
        required: Object.keys(properties)
    };
}
function generateCollectionJoinsSchemas(collections) {
    const properties = [
        ...collections
    ].reduce((acc, { slug, joins, polymorphicJoins })=>{
        const schema = {
            type: 'object',
            additionalProperties: false,
            properties: {},
            required: []
        };
        for(const collectionSlug in joins){
            for (const join of joins[collectionSlug]){
                ;
                schema.properties[join.joinPath] = {
                    type: 'string',
                    enum: [
                        collectionSlug
                    ]
                };
                schema.required.push(join.joinPath);
            }
        }
        for (const join of polymorphicJoins){
            ;
            schema.properties[join.joinPath] = {
                type: 'string',
                enum: join.field.collection
            };
            schema.required.push(join.joinPath);
        }
        if (Object.keys(schema.properties).length > 0) {
            acc[slug] = schema;
        }
        return acc;
    }, {});
    return {
        type: 'object',
        additionalProperties: false,
        properties,
        required: Object.keys(properties)
    };
}
function generateLocaleEntitySchemas(localization) {
    if (localization && 'locales' in localization && localization?.locales) {
        const localesFromConfig = localization?.locales;
        const locales = [
            ...localesFromConfig
        ].map((locale)=>{
            return locale.code;
        }, []);
        return {
            type: 'string',
            enum: locales
        };
    }
    return {
        type: 'null'
    };
}
function generateFallbackLocaleEntitySchemas(localization) {
    if (localization && 'localeCodes' in localization && localization?.localeCodes) {
        const localeCodes = [
            ...localization.localeCodes
        ].map((localeCode)=>{
            return localeCode;
        }, []);
        return {
            oneOf: [
                {
                    type: 'string',
                    enum: [
                        'false',
                        'none',
                        'null'
                    ]
                },
                {
                    type: 'boolean',
                    enum: [
                        false
                    ]
                },
                {
                    type: 'null'
                },
                {
                    type: 'string',
                    enum: localeCodes
                },
                {
                    type: 'array',
                    items: {
                        type: 'string',
                        enum: localeCodes
                    }
                }
            ]
        };
    }
    return {
        type: 'null'
    };
}
function generateAuthEntitySchemas(entities) {
    const properties = [
        ...entities
    ].filter(({ auth })=>Boolean(auth)).map(({ slug })=>{
        return {
            allOf: [
                {
                    $ref: `#/definitions/${slug}`
                },
                {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        collection: {
                            type: 'string',
                            enum: [
                                slug
                            ]
                        }
                    },
                    required: [
                        'collection'
                    ]
                }
            ]
        };
    }, {});
    return {
        oneOf: properties
    };
}
/**
 * Generates the JSON Schema for database configuration
 *
 * @example { db: idType: string }
 */ function generateDbEntitySchema(config) {
    const defaultIDType = config.db?.defaultIDType === 'number' ? {
        type: 'number'
    } : {
        type: 'string'
    };
    return {
        type: 'object',
        additionalProperties: false,
        properties: {
            defaultIDType
        },
        required: [
            'defaultIDType'
        ]
    };
}
/**
 * Returns a JSON Schema Type with 'null' added if the field is not required.
 */ export function withNullableJSONSchemaType(fieldType, isRequired) {
    const fieldTypes = [
        fieldType
    ];
    if (isRequired) {
        return fieldType;
    }
    fieldTypes.push('null');
    return fieldTypes;
}
function entityOrFieldToJsDocs({ entity, i18n }) {
    let description = undefined;
    if (entity?.admin?.description) {
        if (typeof entity?.admin?.description === 'string') {
            description = entity?.admin?.description;
        } else if (typeof entity?.admin?.description === 'object') {
            if (entity?.admin?.description?.en) {
                description = entity?.admin?.description?.en;
            } else if (entity?.admin?.description?.[i18n.language]) {
                description = entity?.admin?.description?.[i18n.language];
            }
        } else if (typeof entity?.admin?.description === 'function' && i18n) {
        // do not evaluate description functions for generating JSDocs. The output of
        // those can differ depending on where and when they are called, creating
        // inconsistencies in the generated JSDocs.
        }
    }
    return description;
}
export function fieldsToJSONSchema(/**
   * Used for relationship fields, to determine whether to use a string or number type for the ID.
   * While there is a default ID field type set by the db adapter, they can differ on a collection-level
   * if they have custom ID fields.
   */ collectionIDFieldTypes, fields, /**
   * Allows you to define new top-level interfaces that can be re-used in the output schema.
   */ interfaceNameDefinitions, config, i18n) {
    const requiredFieldNames = new Set();
    return {
        properties: Object.fromEntries(fields.reduce((fieldSchemas, field, index)=>{
            const isRequired = fieldAffectsData(field) && fieldIsRequired(field);
            const fieldDescription = entityOrFieldToJsDocs({
                entity: field,
                i18n
            });
            const baseFieldSchema = {};
            if (fieldDescription) {
                baseFieldSchema.description = fieldDescription;
            }
            let fieldSchema;
            switch(field.type){
                case 'array':
                    {
                        fieldSchema = {
                            ...baseFieldSchema,
                            type: withNullableJSONSchemaType('array', isRequired),
                            items: {
                                type: 'object',
                                additionalProperties: false,
                                ...fieldsToJSONSchema(collectionIDFieldTypes, field.flattenedFields, interfaceNameDefinitions, config, i18n)
                            }
                        };
                        if (field.interfaceName) {
                            interfaceNameDefinitions.set(field.interfaceName, fieldSchema);
                            fieldSchema = {
                                $ref: `#/definitions/${field.interfaceName}`
                            };
                        }
                        break;
                    }
                case 'blocks':
                    {
                        // Check for a case where no blocks are provided.
                        // We need to generate an empty array for this case, note that JSON schema 4 doesn't support empty arrays
                        // so the best we can get is `unknown[]`
                        const hasBlocks = Boolean(field.blockReferences ? field.blockReferences.length : field.blocks.length);
                        fieldSchema = {
                            ...baseFieldSchema,
                            type: withNullableJSONSchemaType('array', isRequired),
                            items: hasBlocks ? {
                                oneOf: (field.blockReferences ?? field.blocks).map((block)=>{
                                    if (typeof block === 'string') {
                                        const resolvedBlock = config?.blocks?.find((b)=>b.slug === block);
                                        return {
                                            $ref: `#/definitions/${resolvedBlock.interfaceName ?? resolvedBlock.slug}`
                                        };
                                    }
                                    const blockFieldSchemas = fieldsToJSONSchema(collectionIDFieldTypes, block.flattenedFields, interfaceNameDefinitions, config, i18n);
                                    const blockSchema = {
                                        type: 'object',
                                        additionalProperties: false,
                                        properties: {
                                            ...blockFieldSchemas.properties,
                                            blockType: {
                                                const: block.slug
                                            }
                                        },
                                        required: [
                                            'blockType',
                                            ...blockFieldSchemas.required
                                        ]
                                    };
                                    if (block.interfaceName) {
                                        interfaceNameDefinitions.set(block.interfaceName, blockSchema);
                                        return {
                                            $ref: `#/definitions/${block.interfaceName}`
                                        };
                                    }
                                    return blockSchema;
                                })
                            } : {}
                        };
                        break;
                    }
                case 'checkbox':
                    {
                        fieldSchema = {
                            ...baseFieldSchema,
                            type: withNullableJSONSchemaType('boolean', isRequired)
                        };
                        break;
                    }
                case 'code':
                case 'date':
                case 'email':
                case 'textarea':
                    {
                        fieldSchema = {
                            ...baseFieldSchema,
                            type: withNullableJSONSchemaType('string', isRequired)
                        };
                        break;
                    }
                case 'group':
                    {
                        if (fieldAffectsData(field)) {
                            fieldSchema = {
                                ...baseFieldSchema,
                                type: 'object',
                                additionalProperties: false,
                                ...fieldsToJSONSchema(collectionIDFieldTypes, field.flattenedFields, interfaceNameDefinitions, config, i18n)
                            };
                            if (field.interfaceName) {
                                interfaceNameDefinitions.set(field.interfaceName, fieldSchema);
                                fieldSchema = {
                                    $ref: `#/definitions/${field.interfaceName}`
                                };
                            }
                        }
                        break;
                    }
                case 'join':
                    {
                        let items;
                        if (Array.isArray(field.collection)) {
                            items = {
                                oneOf: field.collection.map((collection)=>({
                                        type: 'object',
                                        additionalProperties: false,
                                        properties: {
                                            relationTo: {
                                                const: collection
                                            },
                                            value: {
                                                oneOf: [
                                                    {
                                                        type: collectionIDFieldTypes[collection]
                                                    },
                                                    {
                                                        $ref: `#/definitions/${collection}`
                                                    }
                                                ]
                                            }
                                        },
                                        required: [
                                            'collectionSlug',
                                            'value'
                                        ]
                                    }))
                            };
                        } else {
                            items = {
                                oneOf: [
                                    {
                                        type: collectionIDFieldTypes[field.collection]
                                    },
                                    {
                                        $ref: `#/definitions/${field.collection}`
                                    }
                                ]
                            };
                        }
                        fieldSchema = {
                            ...baseFieldSchema,
                            type: 'object',
                            additionalProperties: false,
                            properties: {
                                docs: {
                                    type: 'array',
                                    items
                                },
                                hasNextPage: {
                                    type: 'boolean'
                                },
                                totalDocs: {
                                    type: 'number'
                                }
                            }
                        };
                        break;
                    }
                case 'json':
                    {
                        fieldSchema = field.jsonSchema?.schema || {
                            ...baseFieldSchema,
                            type: [
                                'object',
                                'array',
                                'string',
                                'number',
                                'boolean',
                                'null'
                            ]
                        };
                        break;
                    }
                case 'number':
                    {
                        if (field.hasMany === true) {
                            fieldSchema = {
                                ...baseFieldSchema,
                                type: withNullableJSONSchemaType('array', isRequired),
                                items: {
                                    type: 'number'
                                }
                            };
                        } else {
                            fieldSchema = {
                                ...baseFieldSchema,
                                type: withNullableJSONSchemaType('number', isRequired)
                            };
                        }
                        break;
                    }
                case 'point':
                    {
                        fieldSchema = {
                            ...baseFieldSchema,
                            type: withNullableJSONSchemaType('array', isRequired),
                            items: [
                                {
                                    type: 'number'
                                },
                                {
                                    type: 'number'
                                }
                            ],
                            maxItems: 2,
                            minItems: 2
                        };
                        break;
                    }
                case 'radio':
                    {
                        fieldSchema = {
                            ...baseFieldSchema,
                            type: withNullableJSONSchemaType('string', isRequired),
                            enum: buildOptionEnums(field.options)
                        };
                        if (field.interfaceName) {
                            interfaceNameDefinitions.set(field.interfaceName, fieldSchema);
                            fieldSchema = {
                                $ref: `#/definitions/${field.interfaceName}`
                            };
                        }
                        break;
                    }
                case 'relationship':
                case 'upload':
                    {
                        if (Array.isArray(field.relationTo)) {
                            if (field.hasMany) {
                                fieldSchema = {
                                    ...baseFieldSchema,
                                    type: withNullableJSONSchemaType('array', isRequired),
                                    items: {
                                        oneOf: field.relationTo.map((relation)=>{
                                            return {
                                                type: 'object',
                                                additionalProperties: false,
                                                properties: {
                                                    relationTo: {
                                                        const: relation
                                                    },
                                                    value: {
                                                        oneOf: [
                                                            {
                                                                type: collectionIDFieldTypes[relation]
                                                            },
                                                            {
                                                                $ref: `#/definitions/${relation}`
                                                            }
                                                        ]
                                                    }
                                                },
                                                required: [
                                                    'value',
                                                    'relationTo'
                                                ]
                                            };
                                        })
                                    }
                                };
                            } else {
                                fieldSchema = {
                                    ...baseFieldSchema,
                                    oneOf: field.relationTo.map((relation)=>{
                                        return {
                                            type: withNullableJSONSchemaType('object', isRequired),
                                            additionalProperties: false,
                                            properties: {
                                                relationTo: {
                                                    const: relation
                                                },
                                                value: {
                                                    oneOf: [
                                                        {
                                                            type: collectionIDFieldTypes[relation]
                                                        },
                                                        {
                                                            $ref: `#/definitions/${relation}`
                                                        }
                                                    ]
                                                }
                                            },
                                            required: [
                                                'value',
                                                'relationTo'
                                            ]
                                        };
                                    })
                                };
                            }
                        } else if (field.hasMany) {
                            fieldSchema = {
                                ...baseFieldSchema,
                                type: withNullableJSONSchemaType('array', isRequired),
                                items: {
                                    oneOf: [
                                        {
                                            type: collectionIDFieldTypes[field.relationTo]
                                        },
                                        {
                                            $ref: `#/definitions/${field.relationTo}`
                                        }
                                    ]
                                }
                            };
                        } else {
                            fieldSchema = {
                                ...baseFieldSchema,
                                oneOf: [
                                    {
                                        type: withNullableJSONSchemaType(collectionIDFieldTypes[field.relationTo], isRequired)
                                    },
                                    {
                                        $ref: `#/definitions/${field.relationTo}`
                                    }
                                ]
                            };
                        }
                        break;
                    }
                case 'richText':
                    {
                        if (!field?.editor) {
                            throw new MissingEditorProp(field) // while we allow disabling editor functionality, you should not have any richText fields defined if you do not have an editor
                            ;
                        }
                        if (typeof field.editor === 'function') {
                            throw new Error('Attempted to access unsanitized rich text editor.');
                        }
                        if (field.editor.outputSchema) {
                            fieldSchema = {
                                ...baseFieldSchema,
                                ...field.editor.outputSchema({
                                    collectionIDFieldTypes,
                                    config,
                                    field,
                                    i18n,
                                    interfaceNameDefinitions,
                                    isRequired
                                })
                            };
                        } else {
                            // Maintain backwards compatibility with existing rich text editors
                            fieldSchema = {
                                ...baseFieldSchema,
                                type: withNullableJSONSchemaType('array', isRequired),
                                items: {
                                    type: 'object'
                                }
                            };
                        }
                        break;
                    }
                case 'select':
                    {
                        const optionEnums = buildOptionEnums(field.options);
                        // We get the previous field to check for a date in the case of a timezone select
                        // This works because timezone selects are always inserted right after a date with 'timezone: true'
                        const previousField = fields?.[index - 1];
                        const isTimezoneField = previousField?.type === 'date' && previousField.timezone && field.name.includes('_tz');
                        // Check if the timezone field's options match the global config's supported timezones
                        const hasMatchingGlobalTimezones = isTimezoneField && config && optionsAreEqual(field.options, config.admin?.timezones?.supportedTimezones);
                        // Timezone selects should reference the supportedTimezones definition
                        // only if the field's options match the global config
                        if (isTimezoneField && hasMatchingGlobalTimezones) {
                            fieldSchema = {
                                $ref: `#/definitions/supportedTimezones`
                            };
                        } else {
                            if (field.hasMany) {
                                fieldSchema = {
                                    ...baseFieldSchema,
                                    type: withNullableJSONSchemaType('array', isRequired),
                                    items: {
                                        type: 'string'
                                    }
                                };
                                if (optionEnums?.length) {
                                    ;
                                    fieldSchema.items.enum = optionEnums;
                                }
                            } else {
                                fieldSchema = {
                                    ...baseFieldSchema,
                                    type: withNullableJSONSchemaType('string', isRequired)
                                };
                                if (optionEnums?.length) {
                                    fieldSchema.enum = optionEnums;
                                }
                            }
                            if (field.interfaceName) {
                                interfaceNameDefinitions.set(field.interfaceName, fieldSchema);
                                fieldSchema = {
                                    $ref: `#/definitions/${field.interfaceName}`
                                };
                            }
                            break;
                        }
                        break;
                    }
                case 'tab':
                    {
                        fieldSchema = {
                            ...baseFieldSchema,
                            type: 'object',
                            additionalProperties: false,
                            ...fieldsToJSONSchema(collectionIDFieldTypes, field.flattenedFields, interfaceNameDefinitions, config, i18n)
                        };
                        if (field.interfaceName) {
                            interfaceNameDefinitions.set(field.interfaceName, fieldSchema);
                            fieldSchema = {
                                $ref: `#/definitions/${field.interfaceName}`
                            };
                        }
                        break;
                    }
                case 'text':
                    if (field.hasMany === true) {
                        fieldSchema = {
                            ...baseFieldSchema,
                            type: withNullableJSONSchemaType('array', isRequired),
                            items: {
                                type: 'string'
                            }
                        };
                    } else {
                        fieldSchema = {
                            ...baseFieldSchema,
                            type: withNullableJSONSchemaType('string', isRequired)
                        };
                    }
                    break;
                default:
                    {
                        break;
                    }
            }
            if ('typescriptSchema' in field && field?.typescriptSchema?.length) {
                for (const schema of field.typescriptSchema){
                    fieldSchema = schema({
                        jsonSchema: fieldSchema
                    });
                }
            }
            if (fieldSchema && fieldAffectsData(field)) {
                if (isRequired && fieldSchema.required !== false) {
                    requiredFieldNames.add(field.name);
                }
                fieldSchemas.set(field.name, fieldSchema);
            }
            return fieldSchemas;
        }, new Map())),
        required: Array.from(requiredFieldNames)
    };
}
// This function is part of the public API and is exported through payload/utilities
export function entityToJSONSchema(config, entity, interfaceNameDefinitions, defaultIDType, collectionIDFieldTypes, i18n) {
    if (!collectionIDFieldTypes) {
        collectionIDFieldTypes = getCollectionIDFieldTypes({
            config,
            defaultIDType
        });
    }
    const title = entity.typescript?.interface ? entity.typescript.interface : formatNames(entity.slug).singular;
    let mutableFields = [
        ...entity.flattenedFields
    ];
    const idField = {
        name: 'id',
        type: defaultIDType,
        required: true
    };
    const customIdField = mutableFields.find((field)=>field.name === 'id');
    if (customIdField && customIdField.type !== 'group' && customIdField.type !== 'tab') {
        mutableFields = mutableFields.map((field)=>{
            if (field === customIdField) {
                return {
                    ...field,
                    required: true
                };
            }
            return field;
        });
    } else {
        mutableFields.unshift(idField);
    }
    // mark timestamp fields required
    if ('timestamps' in entity && entity.timestamps !== false) {
        mutableFields = mutableFields.map((field)=>{
            if (field.name === 'createdAt' || field.name === 'updatedAt') {
                return {
                    ...field,
                    required: true
                };
            }
            return field;
        });
    }
    if ('auth' in entity && entity.auth && (!entity.auth?.disableLocalStrategy || typeof entity.auth?.disableLocalStrategy === 'object' && entity.auth.disableLocalStrategy.enableFields)) {
        mutableFields.push({
            name: 'password',
            type: 'text'
        });
    }
    const jsonSchema = {
        type: 'object',
        additionalProperties: false,
        title,
        ...fieldsToJSONSchema(collectionIDFieldTypes, mutableFields, interfaceNameDefinitions, config, i18n)
    };
    const entityDescription = entityOrFieldToJsDocs({
        entity,
        i18n
    });
    if (entityDescription) {
        jsonSchema.description = entityDescription;
    }
    return jsonSchema;
}
export function fieldsToSelectJSONSchema({ config, fields, interfaceNameDefinitions }) {
    const schema = {
        type: 'object',
        additionalProperties: false,
        properties: {}
    };
    for (const field of fields){
        switch(field.type){
            case 'array':
            case 'group':
            case 'tab':
                {
                    let fieldSchema = fieldsToSelectJSONSchema({
                        config,
                        fields: field.flattenedFields,
                        interfaceNameDefinitions
                    });
                    if (field.interfaceName) {
                        const definition = `${field.interfaceName}_select`;
                        interfaceNameDefinitions.set(definition, fieldSchema);
                        fieldSchema = {
                            $ref: `#/definitions/${definition}`
                        };
                    }
                    schema.properties[field.name] = {
                        oneOf: [
                            {
                                type: 'boolean'
                            },
                            fieldSchema
                        ]
                    };
                    break;
                }
            case 'blocks':
                {
                    const blocksSchema = {
                        type: 'object',
                        additionalProperties: false,
                        properties: {}
                    };
                    for (const block of field.blockReferences ?? field.blocks){
                        if (typeof block === 'string') {
                            continue; // TODO
                        }
                        let blockSchema = fieldsToSelectJSONSchema({
                            config,
                            fields: block.flattenedFields,
                            interfaceNameDefinitions
                        });
                        if (block.interfaceName) {
                            const definition = `${block.interfaceName}_select`;
                            interfaceNameDefinitions.set(definition, blockSchema);
                            blockSchema = {
                                $ref: `#/definitions/${definition}`
                            };
                        }
                        blocksSchema.properties[block.slug] = {
                            oneOf: [
                                {
                                    type: 'boolean'
                                },
                                blockSchema
                            ]
                        };
                    }
                    schema.properties[field.name] = {
                        oneOf: [
                            {
                                type: 'boolean'
                            },
                            blocksSchema
                        ]
                    };
                    break;
                }
            default:
                schema.properties[field.name] = {
                    type: 'boolean'
                };
                break;
        }
    }
    return schema;
}
const fieldType = {
    type: 'string',
    required: false
};
const generateAuthFieldTypes = ({ type, loginWithUsername })=>{
    if (loginWithUsername) {
        switch(type){
            case 'forgotOrUnlock':
                {
                    if (loginWithUsername.allowEmailLogin) {
                        // allow email or username for unlock/forgot-password
                        return {
                            additionalProperties: false,
                            oneOf: [
                                {
                                    additionalProperties: false,
                                    properties: {
                                        email: fieldType
                                    },
                                    required: [
                                        'email'
                                    ]
                                },
                                {
                                    additionalProperties: false,
                                    properties: {
                                        username: fieldType
                                    },
                                    required: [
                                        'username'
                                    ]
                                }
                            ]
                        };
                    } else {
                        // allow only username for unlock/forgot-password
                        return {
                            additionalProperties: false,
                            properties: {
                                username: fieldType
                            },
                            required: [
                                'username'
                            ]
                        };
                    }
                }
            case 'login':
                {
                    if (loginWithUsername.allowEmailLogin) {
                        // allow username or email and require password for login
                        return {
                            additionalProperties: false,
                            oneOf: [
                                {
                                    additionalProperties: false,
                                    properties: {
                                        email: fieldType,
                                        password: fieldType
                                    },
                                    required: [
                                        'email',
                                        'password'
                                    ]
                                },
                                {
                                    additionalProperties: false,
                                    properties: {
                                        password: fieldType,
                                        username: fieldType
                                    },
                                    required: [
                                        'username',
                                        'password'
                                    ]
                                }
                            ]
                        };
                    } else {
                        // allow only username and password for login
                        return {
                            additionalProperties: false,
                            properties: {
                                password: fieldType,
                                username: fieldType
                            },
                            required: [
                                'username',
                                'password'
                            ]
                        };
                    }
                }
            case 'register':
                {
                    const requiredFields = [
                        'password'
                    ];
                    const properties = {
                        password: fieldType,
                        username: fieldType
                    };
                    if (loginWithUsername.requireEmail) {
                        requiredFields.push('email');
                    }
                    if (loginWithUsername.requireUsername) {
                        requiredFields.push('username');
                    }
                    if (loginWithUsername.requireEmail || loginWithUsername.allowEmailLogin) {
                        properties.email = fieldType;
                    }
                    return {
                        additionalProperties: false,
                        properties,
                        required: requiredFields
                    };
                }
        }
    }
    // default email (and password for login/register)
    return {
        additionalProperties: false,
        properties: {
            email: fieldType,
            password: fieldType
        },
        required: [
            'email',
            'password'
        ]
    };
};
export function authCollectionToOperationsJSONSchema(config) {
    const loginWithUsername = config.auth?.loginWithUsername;
    const loginUserFields = generateAuthFieldTypes({
        type: 'login',
        loginWithUsername
    });
    const forgotOrUnlockUserFields = generateAuthFieldTypes({
        type: 'forgotOrUnlock',
        loginWithUsername
    });
    const registerUserFields = generateAuthFieldTypes({
        type: 'register',
        loginWithUsername
    });
    const properties = {
        forgotPassword: forgotOrUnlockUserFields,
        login: loginUserFields,
        registerFirstUser: registerUserFields,
        unlock: forgotOrUnlockUserFields
    };
    return {
        type: 'object',
        additionalProperties: false,
        properties,
        required: Object.keys(properties),
        title: `${formatNames(config.slug).singular}AuthOperations`
    };
}
// Generates the JSON Schema for supported timezones
export function timezonesToJSONSchema(supportedTimezones) {
    return {
        description: 'Supported timezones in IANA format.',
        enum: supportedTimezones.map((timezone)=>typeof timezone === 'string' ? timezone : timezone.value)
    };
}
function generateAuthOperationSchemas(collections) {
    const properties = collections.reduce((acc, collection)=>{
        if (collection.auth) {
            acc[collection.slug] = {
                $ref: `#/definitions/auth/${collection.slug}`
            };
        }
        return acc;
    }, {});
    return {
        type: 'object',
        additionalProperties: false,
        properties,
        required: Object.keys(properties)
    };
}
/**
 * This is used for generating the TypeScript types (payload-types.ts) with the payload generate:types command.
 */ export function configToJSONSchema(config, defaultIDType, i18n) {
    // a mutable Map to store custom top-level `interfaceName` types. Fields with an `interfaceName` property will be moved to the top-level definitions here
    const interfaceNameDefinitions = new Map();
    //  Used for relationship fields, to determine whether to use a string or number type for the ID.
    const collectionIDFieldTypes = getCollectionIDFieldTypes({
        config,
        defaultIDType: defaultIDType
    });
    // Collections and Globals have to be moved to the top-level definitions as well. Reason: The top-level type will be the `Config` type - we don't want all collection and global
    // types to be inlined inside the `Config` type
    const entities = [
        ...config.globals.map((global)=>({
                type: 'global',
                entity: global
            })),
        ...config.collections.map((collection)=>({
                type: 'collection',
                entity: collection
            }))
    ];
    const entityDefinitions = entities.reduce((acc, { type, entity })=>{
        acc[entity.slug] = entityToJSONSchema(config, entity, interfaceNameDefinitions, defaultIDType, collectionIDFieldTypes, i18n);
        const select = fieldsToSelectJSONSchema({
            config,
            fields: entity.flattenedFields,
            interfaceNameDefinitions
        });
        if (type === 'global') {
            select.properties.globalType = {
                type: 'boolean'
            };
        }
        acc[`${entity.slug}_select`] = {
            type: 'object',
            additionalProperties: false,
            ...select
        };
        return acc;
    }, {});
    const timezoneDefinitions = timezonesToJSONSchema(config.admin.timezones.supportedTimezones);
    const authOperationDefinitions = [
        ...config.collections
    ].filter(({ auth })=>Boolean(auth)).reduce((acc, authCollection)=>{
        acc.auth[authCollection.slug] = authCollectionToOperationsJSONSchema(authCollection);
        return acc;
    }, {
        auth: {}
    });
    const jobsSchemas = config.jobs ? generateJobsJSONSchemas(config, config.jobs, interfaceNameDefinitions, collectionIDFieldTypes, i18n) : {};
    const blocksDefinition = {
        type: 'object',
        additionalProperties: false,
        properties: {},
        required: []
    };
    if (config?.blocks?.length) {
        for (const block of config.blocks){
            const blockFieldSchemas = fieldsToJSONSchema(collectionIDFieldTypes, block.flattenedFields, interfaceNameDefinitions, config, i18n);
            const blockSchema = {
                type: 'object',
                additionalProperties: false,
                properties: {
                    ...blockFieldSchemas.properties,
                    blockType: {
                        const: block.slug
                    }
                },
                required: [
                    'blockType',
                    ...blockFieldSchemas.required
                ]
            };
            const interfaceName = block.interfaceName ?? block.slug;
            interfaceNameDefinitions.set(interfaceName, blockSchema);
            blocksDefinition.properties[block.slug] = {
                $ref: `#/definitions/${interfaceName}`
            };
            blocksDefinition.required.push(block.slug);
        }
    }
    let jsonSchema = {
        additionalProperties: false,
        definitions: {
            supportedTimezones: timezoneDefinitions,
            ...entityDefinitions,
            ...Object.fromEntries(interfaceNameDefinitions),
            ...authOperationDefinitions
        },
        // These properties here will be very simple, as all the complexity is in the definitions. These are just the properties for the top-level `Config` type
        type: 'object',
        properties: {
            auth: generateAuthOperationSchemas(config.collections),
            blocks: blocksDefinition,
            collections: generateEntitySchemas(config.collections || []),
            collectionsJoins: generateCollectionJoinsSchemas(config.collections || []),
            collectionsSelect: generateEntitySelectSchemas(config.collections || []),
            db: generateDbEntitySchema(config),
            fallbackLocale: generateFallbackLocaleEntitySchemas(config.localization),
            globals: generateEntitySchemas(config.globals || []),
            globalsSelect: generateEntitySelectSchemas(config.globals || []),
            locale: generateLocaleEntitySchemas(config.localization),
            ...config.typescript?.strictDraftTypes ? {
                strictDraftTypes: {
                    type: 'boolean',
                    const: true
                }
            } : {},
            user: generateAuthEntitySchemas(config.collections)
        },
        required: [
            'user',
            'locale',
            'fallbackLocale',
            'collections',
            'collectionsSelect',
            'collectionsJoins',
            'globalsSelect',
            ...config.typescript?.strictDraftTypes ? [
                'strictDraftTypes'
            ] : [],
            'globals',
            'auth',
            'db',
            'jobs',
            'blocks'
        ],
        title: 'Config'
    };
    if (jobsSchemas.definitions?.size) {
        for (const [key, value] of jobsSchemas.definitions){
            jsonSchema.definitions[key] = value;
        }
    }
    if (jobsSchemas.properties) {
        jsonSchema.properties.jobs = {
            type: 'object',
            additionalProperties: false,
            properties: jobsSchemas.properties,
            required: [
                'tasks',
                'workflows'
            ]
        };
    }
    if (config?.typescript?.schema?.length) {
        for (const schema of config.typescript.schema){
            jsonSchema = schema({
                collectionIDFieldTypes,
                config,
                i18n: i18n,
                jsonSchema
            });
        }
    }
    return jsonSchema;
}

//# sourceMappingURL=configToJSONSchema.js.map