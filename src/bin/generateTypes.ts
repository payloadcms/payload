/* eslint-disable no-nested-ternary */
import fs from 'fs';
import type { JSONSchema4 } from 'json-schema';
import { compile } from 'json-schema-to-typescript';
import Logger from '../utilities/logger';
import { fieldAffectsData, Field, Option, FieldAffectingData } from '../fields/config/types';
import { SanitizedCollectionConfig } from '../collections/config/types';
import { SanitizedConfig } from '../config/types';
import loadConfig from '../config/load';
import { SanitizedGlobalConfig } from '../globals/config/types';
import deepCopyObject from '../utilities/deepCopyObject';

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
        .filter((field) => fieldAffectsData(field) && field.required === true)
        .map((field) => (fieldAffectsData(field) ? field.name : '')),
      ...requiredTopLevelProps,
    ],
  };
}

function entityToJsonSchema(config: SanitizedConfig, incomingEntity: SanitizedCollectionConfig | SanitizedGlobalConfig): JSONSchema4 {
  const entity = deepCopyObject(incomingEntity);
  const title = 'label' in entity ? entity.label : entity.labels.singular;

  const idField: FieldAffectingData = { type: 'text', name: 'id', required: true };
  const customIdField = entity.fields.find((field) => fieldAffectsData(field) && field.name === 'id') as FieldAffectingData;

  if (customIdField) {
    customIdField.required = true;
  } else {
    entity.fields.unshift(idField);
  }

  if ('timestamps' in entity && entity.timestamps !== false) {
    entity.fields.push(
      {
        type: 'text',
        name: 'createdAt',
        required: true,
      },
      {
        type: 'text',
        name: 'updatedAt',
        required: true,
      },
    );
  }

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
  const logger = Logger();
  const config = loadConfig();

  logger.info('Compiling TS types for Collections and Globals...');

  const jsonSchema = configToJsonSchema(config);

  compile(jsonSchema, 'Config', {
    unreachableDefinitions: true,
    bannerComment: '/* tslint:disable */\n/**\n* This file was automatically generated by Payload CMS.\n* DO NOT MODIFY IT BY HAND. Instead, modify your source Payload config,\n* and re-run `payload generate:types` to regenerate this file.\n*/',
    style: {
      singleQuote: true,
    },
  }).then((compiled) => {
    fs.writeFileSync(config.typescript.outputFile, compiled);
    logger.info(`Types written to ${config.typescript.outputFile}`);
  });
}

// when generateTypes.js is launched directly
if (module.id === require.main.id) {
  generateTypes();
}
