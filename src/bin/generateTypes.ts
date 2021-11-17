/* eslint-disable no-nested-ternary */
import fs from 'fs';
import type { JSONSchema4 } from 'json-schema';
import { compile } from 'json-schema-to-typescript';
import { fieldIsPresentationalOnly, fieldAffectsData, Field } from '../fields/config/types';
import { SanitizedCollectionConfig } from '../collections/config/types';
import { SanitizedConfig } from '../config/types';
import loadConfig from '../config/load';
import { SanitizedGlobalConfig } from '../globals/config/types';

function getCollectionIDType(collections: SanitizedCollectionConfig[], slug): 'string' | 'number' {
  const matchedCollection = collections.find((collection) => collection.slug === slug);
  if (matchedCollection) {
    const idField = matchedCollection.fields.find((field) => 'name' in field && field.name === 'id');

    if (idField && idField.type === 'number') {
      return 'number';
    }

    return 'string';
  }

  return undefined;
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
          case 'email': {
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

          // TODO:
          // Add enum types like Radio and Select
          // Add point field type

          case 'relationship': {
            if (Array.isArray(field.relationTo)) {
              if (field.hasMany) {
                fieldSchema = {
                  type: 'array',
                  items: {
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
                  },
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
                  type: 'array',
                  items: {
                    oneOf: [
                      {
                        type: idFieldType,
                      },
                      {
                        $ref: `#/definitions/${field.relationTo}`,
                      },
                    ],
                  },
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

          case 'row': {
            const topLevelFields = generateFieldTypes(config, field.fields);
            requiredTopLevelProps = requiredTopLevelProps.concat(topLevelFields.required);
            topLevelProps = topLevelProps.concat(Object.entries(topLevelFields.properties).map((prop) => prop));
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

        let default_ = {};

        if (!fieldIsPresentationalOnly(field) && fieldAffectsData(field) && typeof field.defaultValue !== 'undefined') {
          default_ = { default: field.defaultValue };
        }

        if (fieldSchema && fieldAffectsData(field)) {
          return [
            ...properties,
            [
              field.name,
              {
                ...fieldSchema,
                ...default_,
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
        .filter((field) => fieldAffectsData(field) && field.required === true)
        .map((field) => (fieldAffectsData(field) ? field.name : '')),
      ...requiredTopLevelProps,
    ],
  };
}

function entityToJsonSchema(config: SanitizedConfig, entity: SanitizedCollectionConfig | SanitizedGlobalConfig): any {
  const title = 'label' in entity ? entity.label : entity.labels.singular;

  return {
    title,
    type: 'object',
    additionalProperties: false,
    ...generateFieldTypes(config, entity.fields),
  };
}

function configToJsonSchema(config: SanitizedConfig): JSONSchema4 {
  return {
    definitions: Object.fromEntries(
      [
        ...config.globals.map((global) => [
          global.slug,
          entityToJsonSchema(config, global),
        ]),
        ...config.collections.map((collection) => [
          collection.slug,
          entityToJsonSchema(config, collection),
        ]),
      ],
    ),
    additionalProperties: false,
  };
}

export function generateTypes(): void {
  const config = loadConfig();

  console.log('compiling ts types');
  const jsonSchema = configToJsonSchema(config);

  compile(jsonSchema, 'Config', {
    bannerComment: '// auto-generated by payload',
    unreachableDefinitions: true,
  }).then((compiled) => {
    fs.writeFileSync(config.typescript.outputFile, compiled);
  });
}

// when generateTypes.js is launched directly
if (module.id === require.main.id) {
  generateTypes();
}
