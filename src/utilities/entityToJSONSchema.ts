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

function getCollectionIDType(collections: SanitizedCollectionConfig[], slug: string): 'string' | 'number' {
  const matchedCollection = collections.find((collection) => collection.slug === slug);
  const customIdField = matchedCollection.fields.find((field) => 'name' in field && field.name === 'id');

  if (customIdField && customIdField.type === 'number') {
    return 'number';
  }

  return 'string';
}

function returnOptionEnums(options: Option[]): string[] {
  return options.map((option) => {
    if (typeof option === 'object' && 'value' in option) {
      return option.value;
    }

    return option;
  });
}

function entityFieldsToJSONSchema(config: SanitizedConfig, fields: Field[], fieldDefinitionsMap: Map<string, JSONSchema4>): {
  properties: {
    [k: string]: JSONSchema4;
  }
  required: string[]
} {
  // required fields for a schema (could be for a nested schema)
  const requiredFields = new Set<string>(fields.filter(propertyIsRequired).map((field) => (fieldAffectsData(field) ? field.name : '')));

  return {
    properties: Object.fromEntries(fields.reduce((acc, field) => {
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
            } else {
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
          } else {
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
            } else {
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
                const blockFieldSchemas = entityFieldsToJSONSchema(config, block.fields, fieldDefinitionsMap);

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
                  fieldDefinitionsMap.set(block.interfaceName, blockSchema);

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
              ...entityFieldsToJSONSchema(config, field.fields, fieldDefinitionsMap),
            },
          };

          if (field.interfaceName) {
            fieldDefinitionsMap.set(field.interfaceName, fieldSchema);

            fieldSchema = {
              $ref: `#/definitions/${field.interfaceName}`,
            };
          }
          break;
        }

        case 'row':
        case 'collapsible': {
          const childSchema = entityFieldsToJSONSchema(config, field.fields, fieldDefinitionsMap);
          Object.entries(childSchema.properties).forEach(([propName, propSchema]) => {
            acc.set(propName, propSchema);
          });
          childSchema.required.forEach((propName) => {
            requiredFields.add(propName);
          });
          break;
        }

        case 'tabs': {
          field.tabs.forEach((tab) => {
            const childSchema = entityFieldsToJSONSchema(config, tab.fields, fieldDefinitionsMap);
            if (tabHasName(tab)) {
              // could have interface
              acc.set(tab.name, {
                type: 'object',
                additionalProperties: false,
                ...childSchema,
              });
              requiredFields.add(tab.name);
            } else {
              Object.entries(childSchema.properties).forEach(([propName, propSchema]) => {
                acc.set(propName, propSchema);
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
            ...entityFieldsToJSONSchema(config, field.fields, fieldDefinitionsMap),
          };

          if (field.interfaceName) {
            fieldDefinitionsMap.set(field.interfaceName, fieldSchema);

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
        acc.set(field.name, fieldSchema);
      }

      return acc;
    }, new Map<string, JSONSchema4>())),
    required: Array.from(requiredFields),
  };
}

export function entityToJSONSchema(config: SanitizedConfig, incomingEntity: SanitizedCollectionConfig | SanitizedGlobalConfig, fieldDefinitionsMap: Map<string, JSONSchema4>): JSONSchema4 {
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

  return {
    title,
    type: 'object',
    additionalProperties: false,
    ...entityFieldsToJSONSchema(config, entity.fields, fieldDefinitionsMap),
  };
}

export function generateEntitySchemas(entities: (SanitizedCollectionConfig | SanitizedGlobalConfig)[]): JSONSchema4 {
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
