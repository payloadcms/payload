import { singular } from 'pluralize';
import type { JSONSchema4 } from 'json-schema';
import { Field, FieldAffectingData, fieldAffectsData, Option, tabHasName } from '../fields/config/types';
import { SanitizedCollectionConfig } from '../collections/config/types';
import { SanitizedGlobalConfig } from '../globals/config/types';
import deepCopyObject from './deepCopyObject';
import { toWords } from './formatLabels';
import { SanitizedConfig } from '../config/types';

const propertyIsRequired = (field: Field) => {
  if (fieldAffectsData(field) && (('required' in field && field.required === true))) return true;

  if ('fields' in field && field.type !== 'array') {
    if (field.admin?.condition || field.access?.read) return false;
    return field.fields.find((subField) => propertyIsRequired(subField));
  }

  if (field.type === 'tabs') {
    return field.tabs.some((tab) => 'name' in tab && tab.fields.find((subField) => propertyIsRequired(subField)));
  }

  return false;
};

function returnOptionEnums(options: Option[]): string[] {
  return options.map((option) => {
    if (typeof option === 'object' && 'value' in option) {
      return option.value;
    }

    return option;
  });
}

/**
 * This is used for generating the TypeScript types (payload-types.ts) with the payload generate:types command.
 */
function generateEntitySchemas(entities: (SanitizedCollectionConfig | SanitizedGlobalConfig)[]): JSONSchema4 {
  const properties = [...entities].reduce((acc, { slug }) => {
    acc[slug] = {
      $ref: `#/definitions/${slug}`,
    };

    return acc;
  }, {});

  return {
    type: 'object',
    properties,
    required: Object.keys(properties),
    additionalProperties: false,
  };
}

function fieldsToJSONSchema(collectionIDFieldTypes: { [key: string]: 'string' | 'number' }, fields: Field[], interfaceNameDefinitions: Map<string, JSONSchema4>): {
  properties: {
    [k: string]: JSONSchema4;
  }
  required: string[]
} {
  // required fields for a schema (could be for a nested schema)
  const requiredFields = new Set<string>(fields.filter(propertyIsRequired).map((field) => (fieldAffectsData(field) ? field.name : '')));

  return {
    properties: Object.fromEntries(fields.reduce((fieldSchemas, field) => {
      let fieldSchema: JSONSchema4;
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
          if (field.hasMany === true) {
            fieldSchema = { type: 'array', items: { type: 'number' } };
          } else {
            fieldSchema = { type: 'number' };
          }
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
          const selectType: JSONSchema4 = {
            type: 'string',
            enum: returnOptionEnums(field.options),
          };

          if (field.hasMany) {
            fieldSchema = {
              type: 'array',
              items: selectType,
            };
          } else {
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
                        return {
                          type: 'object',
                          additionalProperties: false,
                          properties: {
                            value: {
                              type: collectionIDFieldTypes[relation],
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
            } else {
              fieldSchema = {
                oneOf: field.relationTo.map((relation) => {
                  return {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      value: {
                        oneOf: [
                          {
                            type: collectionIDFieldTypes[relation],
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
          } else if (field.hasMany) {
            fieldSchema = {
              oneOf: [
                {
                  type: 'array',
                  items: {
                    type: collectionIDFieldTypes[field.relationTo],
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
          } else {
            fieldSchema = {
              oneOf: [
                {
                  type: collectionIDFieldTypes[field.relationTo],
                },
                {
                  $ref: `#/definitions/${field.relationTo}`,
                },
              ],
            };
          }

          break;
        }

        case 'upload': {
          fieldSchema = {
            oneOf: [
              {
                type: collectionIDFieldTypes[field.relationTo],
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
                const blockFieldSchemas = fieldsToJSONSchema(collectionIDFieldTypes, block.fields, interfaceNameDefinitions);

                const blockSchema: JSONSchema4 = {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    ...blockFieldSchemas.properties,
                    blockType: {
                      const: block.slug,
                    },
                  },
                  required: [
                    'blockType',
                    ...blockFieldSchemas.required,
                  ],
                };

                if (block.interfaceName) {
                  interfaceNameDefinitions.set(block.interfaceName, blockSchema);

                  return {
                    $ref: `#/definitions/${block.interfaceName}`,
                  };
                }

                return blockSchema;
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
              ...fieldsToJSONSchema(collectionIDFieldTypes, field.fields, interfaceNameDefinitions),
            },
          };

          if (field.interfaceName) {
            interfaceNameDefinitions.set(field.interfaceName, fieldSchema);

            fieldSchema = {
              $ref: `#/definitions/${field.interfaceName}`,
            };
          }
          break;
        }

        case 'row':
        case 'collapsible': {
          const childSchema = fieldsToJSONSchema(collectionIDFieldTypes, field.fields, interfaceNameDefinitions);
          Object.entries(childSchema.properties).forEach(([propName, propSchema]) => {
            fieldSchemas.set(propName, propSchema);
          });
          childSchema.required.forEach((propName) => {
            requiredFields.add(propName);
          });
          break;
        }

        case 'tabs': {
          field.tabs.forEach((tab) => {
            const childSchema = fieldsToJSONSchema(collectionIDFieldTypes, tab.fields, interfaceNameDefinitions);
            if (tabHasName(tab)) {
              // could have interface
              fieldSchemas.set(tab.name, {
                type: 'object',
                additionalProperties: false,
                ...childSchema,
              });
              requiredFields.add(tab.name);
            } else {
              Object.entries(childSchema.properties).forEach(([propName, propSchema]) => {
                fieldSchemas.set(propName, propSchema);
              });
              childSchema.required.forEach((propName) => {
                requiredFields.add(propName);
              });
            }
          });
          break;
        }

        case 'group': {
          fieldSchema = {
            type: 'object',
            additionalProperties: false,
            ...fieldsToJSONSchema(collectionIDFieldTypes, field.fields, interfaceNameDefinitions),
          };

          if (field.interfaceName) {
            interfaceNameDefinitions.set(field.interfaceName, fieldSchema);

            fieldSchema = {
              $ref: `#/definitions/${field.interfaceName}`,
            };
          }
          break;
        }

        default: {
          break;
        }
      }

      if (fieldSchema && fieldAffectsData(field)) {
        fieldSchemas.set(field.name, fieldSchema);
      }

      return fieldSchemas;
    }, new Map<string, JSONSchema4>())),
    required: Array.from(requiredFields),
  };
}

// This function is part of the public API and is exported through payload/utilities
export function entityToJSONSchema(config: SanitizedConfig, incomingEntity: SanitizedCollectionConfig | SanitizedGlobalConfig, interfaceNameDefinitions: Map<string, JSONSchema4>): JSONSchema4 {
  const entity: SanitizedCollectionConfig | SanitizedGlobalConfig = deepCopyObject(incomingEntity);
  const title = entity.typescript?.interface ? entity.typescript.interface : singular(toWords(entity.slug, true));

  const idField: FieldAffectingData = { type: 'text', name: 'id', required: true };
  const customIdField = entity.fields.find((field) => fieldAffectsData(field) && field.name === 'id') as FieldAffectingData;

  if (customIdField && customIdField.type !== 'group' && customIdField.type !== 'tab') {
    customIdField.required = true;
  } else {
    entity.fields.unshift(idField);
  }

  // mark timestamp fields required
  if ('timestamps' in entity && entity.timestamps !== false) {
    entity.fields = entity.fields.map((field) => {
      if (fieldAffectsData(field) && (field.name === 'createdAt' || field.name === 'updatedAt')) {
        return {
          ...field,
          required: true,
        };
      }
      return field;
    });
  }

  if ('auth' in entity && entity.auth && !entity.auth?.disableLocalStrategy) {
    entity.fields.push({
      type: 'text',
      name: 'password',
    });
  }

  // used for relationship fields, to determine whether to use a string or number type for the ID
  const collectionIDFieldTypes: { [key: string]: 'string' | 'number' } = config.collections.reduce((acc, collection) => {
    const customCollectionIdField = collection.fields.find((field) => 'name' in field && field.name === 'id');

    acc[collection.slug] = customCollectionIdField?.type === 'number'
      ? 'number'
      : 'string';

    return acc;
  }, {});

  return {
    title,
    type: 'object',
    additionalProperties: false,
    ...fieldsToJSONSchema(collectionIDFieldTypes, entity.fields, interfaceNameDefinitions),
  };
}

export function configToJSONSchema(config: SanitizedConfig): JSONSchema4 {
  // a mutable Map to store custom top-level `interfaceName` types
  const interfaceNameDefinitions: Map<string, JSONSchema4> = new Map();
  const entityDefinitions: { [k: string]: JSONSchema4 } = [...config.globals, ...config.collections].reduce((acc, entity) => {
    acc[entity.slug] = entityToJSONSchema(config, entity, interfaceNameDefinitions);
    return acc;
  }, {});

  return {
    title: 'Config',
    type: 'object',
    additionalProperties: false,
    properties: {
      collections: generateEntitySchemas(config.collections),
      globals: generateEntitySchemas(config.globals),
    },
    required: ['collections', 'globals'],
    definitions: { ...entityDefinitions, ...Object.fromEntries(interfaceNameDefinitions) },
  };
}
