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

  if ('fields' in field) {
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

function generateFieldTypes(config: SanitizedConfig, fields: Field[]): {
  properties: {
    [k: string]: JSONSchema4;
  }
  required: string[]
} {
  let topLevelProps = [];
  let requiredTopLevelProps = [];

  return {
    properties: Object.fromEntries(
      fields.reduce((properties, field) => {
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
              if (tabHasName(tab)) {
                requiredTopLevelProps.push(tab.name);

                topLevelProps.push([
                  tab.name,
                  {
                    type: 'object',
                    additionalProperties: false,
                    ...generateFieldTypes(config, tab.fields),
                  },
                ]);
              } else {
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

        if (fieldSchema && fieldAffectsData(field)) {
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
      }, []),
    ),
    required: [
      ...fields
        .filter(propertyIsRequired)
        .map((field) => (fieldAffectsData(field) ? field.name : '')),
      ...requiredTopLevelProps,
    ],
  };
}

export function entityToJSONSchema(config: SanitizedConfig, incomingEntity: SanitizedCollectionConfig | SanitizedGlobalConfig): JSONSchema4 {
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
    ...generateFieldTypes(config, entity.fields),
  };
}

export function generateEntityObject(config: SanitizedConfig, type: 'collections' | 'globals'): JSONSchema4 {
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
