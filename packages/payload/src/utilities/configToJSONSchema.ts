import type { JSONSchema4 } from 'json-schema';

import { singular } from 'pluralize';

import type { SanitizedCollectionConfig } from '../collections/config/types';
import type { SanitizedConfig } from '../config/types';
import type { Field, FieldAffectingData, Option} from '../fields/config/types';
import type { SanitizedGlobalConfig } from '../globals/config/types';

import { fieldAffectsData, tabHasName } from '../fields/config/types';
import deepCopyObject from './deepCopyObject';
import { toWords } from './formatLabels';

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
    additionalProperties: false,
    properties,
    required: Object.keys(properties),
    type: 'object',
  };
}

function fieldsToJSONSchema(collectionIDFieldTypes: { [key: string]: 'number' | 'string' }, fields: Field[], interfaceNameDefinitions: Map<string, JSONSchema4>): {
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
            fieldSchema = { items: { type: 'number' }, type: 'array' };
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
            items: {
              type: 'object',
            },
            type: 'array',
          };

          break;
        }

        case 'radio': {
          fieldSchema = {
            enum: returnOptionEnums(field.options),
            type: 'string',
          };

          break;
        }

        case 'select': {
          const selectType: JSONSchema4 = {
            enum: returnOptionEnums(field.options),
            type: 'string',
          };

          if (field.hasMany) {
            fieldSchema = {
              items: selectType,
              type: 'array',
            };
          } else {
            fieldSchema = selectType;
          }

          break;
        }

        case 'point': {
          fieldSchema = {
            items: [
              {
                type: 'number',
              },
              {
                type: 'number',
              },
            ],
            maxItems: 2,
            minItems: 2,
            type: 'array',
          };
          break;
        }

        case 'relationship': {
          if (Array.isArray(field.relationTo)) {
            if (field.hasMany) {
              fieldSchema = {
                oneOf: [
                  {
                    items: {
                      oneOf: field.relationTo.map((relation) => {
                        return {
                          additionalProperties: false,
                          properties: {
                            relationTo: {
                              const: relation,
                            },
                            value: {
                              type: collectionIDFieldTypes[relation],
                            },
                          },
                          required: ['value', 'relationTo'],
                          type: 'object',
                        };
                      }),
                    },
                    type: 'array',
                  },
                  {
                    items: {
                      oneOf: field.relationTo.map((relation) => {
                        return {
                          additionalProperties: false,
                          properties: {
                            relationTo: {
                              const: relation,
                            },
                            value: {
                              $ref: `#/definitions/${relation}`,
                            },
                          },
                          required: ['value', 'relationTo'],
                          type: 'object',
                        };
                      }),
                    },
                    type: 'array',
                  },
                ],
              };
            } else {
              fieldSchema = {
                oneOf: field.relationTo.map((relation) => {
                  return {
                    additionalProperties: false,
                    properties: {
                      relationTo: {
                        const: relation,
                      },
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
                    },
                    required: ['value', 'relationTo'],
                    type: 'object',
                  };
                }),
              };
            }
          } else if (field.hasMany) {
            fieldSchema = {
              oneOf: [
                {
                  items: {
                    type: collectionIDFieldTypes[field.relationTo],
                  },
                  type: 'array',
                },
                {
                  items: {
                    $ref: `#/definitions/${field.relationTo}`,
                  },
                  type: 'array',
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
            items: {
              oneOf: field.blocks.map((block) => {
                const blockFieldSchemas = fieldsToJSONSchema(collectionIDFieldTypes, block.fields, interfaceNameDefinitions);

                const blockSchema: JSONSchema4 = {
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
                  type: 'object',
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
            type: 'array',
          };
          break;
        }

        case 'array': {
          fieldSchema = {
            items: {
              additionalProperties: false,
              type: 'object',
              ...fieldsToJSONSchema(collectionIDFieldTypes, field.fields, interfaceNameDefinitions),
            },
            type: 'array',
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
                additionalProperties: false,
                type: 'object',
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
            additionalProperties: false,
            type: 'object',
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

  const idField: FieldAffectingData = { name: 'id', required: true, type: 'text' };
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
      name: 'password',
      type: 'text',
    });
  }

  // used for relationship fields, to determine whether to use a string or number type for the ID
  const collectionIDFieldTypes: { [key: string]: 'number' | 'string' } = config.collections.reduce((acc, collection) => {
    const customCollectionIdField = collection.fields.find((field) => 'name' in field && field.name === 'id');

    acc[collection.slug] = customCollectionIdField?.type === 'number'
      ? 'number'
      : 'string';

    return acc;
  }, {});

  return {
    additionalProperties: false,
    title,
    type: 'object',
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
    additionalProperties: false,
    definitions: { ...entityDefinitions, ...Object.fromEntries(interfaceNameDefinitions) },
    properties: {
      collections: generateEntitySchemas(config.collections),
      globals: generateEntitySchemas(config.globals),
    },
    required: ['collections', 'globals'],
    title: 'Config',
    type: 'object',
  };
}
