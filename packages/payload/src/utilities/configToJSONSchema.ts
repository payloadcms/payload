import type { JSONSchema4, JSONSchema4TypeName } from 'json-schema'

import { singular } from 'pluralize'

import type { SanitizedCollectionConfig } from '../collections/config/types'
import type { SanitizedConfig } from '../exports/config'
import type { Field, FieldAffectingData, Option } from '../fields/config/types'
import type { SanitizedGlobalConfig } from '../globals/config/types'

import { fieldAffectsData, tabHasName } from '../fields/config/types'
import { deepCopyObject } from './deepCopyObject'
import { toWords } from './formatLabels'

const fieldIsRequired = (field: Field) => {
  if (fieldAffectsData(field) && 'required' in field && field.required === true) return true

  if ('fields' in field && field.type !== 'array') {
    if (field.admin?.condition || field.access?.read) return false
    return field.fields.find((subField) => fieldIsRequired(subField))
  }

  if (field.type === 'tabs') {
    return field.tabs.some(
      (tab) => 'name' in tab && tab.fields.find((subField) => fieldIsRequired(subField)),
    )
  }

  return false
}

function returnOptionEnums(options: Option[]): string[] {
  return options.map((option) => {
    if (typeof option === 'object' && 'value' in option) {
      return option.value
    }

    return option
  })
}

/**
 * This is used for generating the TypeScript types (payload-types.ts) with the payload generate:types command.
 */
function generateEntitySchemas(
  entities: (SanitizedCollectionConfig | SanitizedGlobalConfig)[],
): JSONSchema4 {
  const properties = [...entities].reduce((acc, { slug }) => {
    acc[slug] = {
      $ref: `#/definitions/${slug}`,
    }

    return acc
  }, {})

  return {
    additionalProperties: false,
    properties,
    required: Object.keys(properties),
    type: 'object',
  }
}

function withNullableType(
  fieldType: JSONSchema4TypeName,
  isRequired: boolean,
): JSONSchema4TypeName[] {
  const fieldTypes = [fieldType]
  if (isRequired) return fieldTypes
  return fieldTypes.includes('null') ? fieldTypes : [...fieldTypes, 'null']
}

function fieldsToJSONSchema(
  collectionIDFieldTypes: { [key: string]: 'number' | 'string' },
  fields: Field[],
  interfaceNameDefinitions: Map<string, JSONSchema4>,
): {
  properties: {
    [k: string]: JSONSchema4
  }
  required: string[]
} {
  const requiredFieldNames = new Set<string>()

  return {
    properties: Object.fromEntries(
      fields.reduce((fieldSchemas, field) => {
        const isRequired = fieldAffectsData(field) && fieldIsRequired(field)
        if (isRequired) requiredFieldNames.add(field.name)
        let fieldSchema: JSONSchema4
        switch (field.type) {
          case 'text':
          case 'textarea':
          case 'code':
          case 'email':
          case 'date': {
            fieldSchema = { type: withNullableType('string', isRequired) }
            break
          }

          case 'number': {
            if (field.hasMany === true) {
              fieldSchema = {
                items: { type: 'number' },
                type: withNullableType('array', isRequired),
              }
            } else {
              fieldSchema = { type: withNullableType('number', isRequired) }
            }
            break
          }

          case 'checkbox': {
            fieldSchema = { type: withNullableType('boolean', isRequired) }
            break
          }

          case 'json': {
            fieldSchema = {
              type: ['object', 'array', 'string', 'number', 'boolean', 'null'],
            }
            break
          }

          case 'richText': {
            fieldSchema = {
              items: {
                type: 'object',
              },
              type: withNullableType('array', isRequired),
            }

            break
          }

          case 'radio': {
            fieldSchema = {
              enum: returnOptionEnums(field.options),
              type: withNullableType('string', isRequired),
            }

            break
          }

          case 'select': {
            const optionEnums = returnOptionEnums(field.options)

            if (field.hasMany) {
              fieldSchema = {
                items: {
                  enum: optionEnums,
                  type: 'string',
                },
                type: withNullableType('array', isRequired),
              }
            } else {
              fieldSchema = {
                enum: optionEnums,
                type: withNullableType('string', isRequired),
              }
            }

            break
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
              type: withNullableType('array', isRequired),
            }
            break
          }

          case 'relationship': {
            if (Array.isArray(field.relationTo)) {
              if (field.hasMany) {
                fieldSchema = {
                  items: {
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
                      }
                    }),
                  },
                  type: withNullableType('array', isRequired),
                }
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
                      type: withNullableType('object', isRequired),
                    }
                  }),
                }
              }
            } else if (field.hasMany) {
              fieldSchema = {
                items: {
                  oneOf: [
                    {
                      type: collectionIDFieldTypes[field.relationTo],
                    },
                    {
                      $ref: `#/definitions/${field.relationTo}`,
                    },
                  ],
                },
                type: withNullableType('array', isRequired),
              }
            } else {
              fieldSchema = {
                oneOf: [
                  {
                    type: withNullableType(collectionIDFieldTypes[field.relationTo], isRequired),
                  },
                  {
                    $ref: `#/definitions/${field.relationTo}`,
                  },
                ],
              }
            }

            break
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
            }
            if (!isRequired) fieldSchema.oneOf.push({ type: 'null' })
            break
          }

          case 'blocks': {
            fieldSchema = {
              items: {
                oneOf: field.blocks.map((block) => {
                  const blockFieldSchemas = fieldsToJSONSchema(
                    collectionIDFieldTypes,
                    block.fields,
                    interfaceNameDefinitions,
                  )

                  const blockSchema: JSONSchema4 = {
                    additionalProperties: false,
                    properties: {
                      ...blockFieldSchemas.properties,
                      blockType: {
                        const: block.slug,
                      },
                    },
                    required: ['blockType', ...blockFieldSchemas.required],
                    type: 'object',
                  }

                  if (block.interfaceName) {
                    interfaceNameDefinitions.set(block.interfaceName, blockSchema)

                    return {
                      $ref: `#/definitions/${block.interfaceName}`,
                    }
                  }

                  return blockSchema
                }),
              },
              type: withNullableType('array', isRequired),
            }
            break
          }

          case 'array': {
            fieldSchema = {
              items: {
                additionalProperties: false,
                type: 'object',
                ...fieldsToJSONSchema(
                  collectionIDFieldTypes,
                  field.fields,
                  interfaceNameDefinitions,
                ),
              },
              type: withNullableType('array', isRequired),
            }

            if (field.interfaceName) {
              interfaceNameDefinitions.set(field.interfaceName, fieldSchema)

              fieldSchema = {
                $ref: `#/definitions/${field.interfaceName}`,
              }
            }
            break
          }

          case 'row':
          case 'collapsible': {
            const childSchema = fieldsToJSONSchema(
              collectionIDFieldTypes,
              field.fields,
              interfaceNameDefinitions,
            )
            Object.entries(childSchema.properties).forEach(([propName, propSchema]) => {
              fieldSchemas.set(propName, propSchema)
            })
            childSchema.required.forEach((propName) => {
              requiredFieldNames.add(propName)
            })
            break
          }

          case 'tabs': {
            field.tabs.forEach((tab) => {
              const childSchema = fieldsToJSONSchema(
                collectionIDFieldTypes,
                tab.fields,
                interfaceNameDefinitions,
              )
              if (tabHasName(tab)) {
                // could have interface
                fieldSchemas.set(tab.name, {
                  additionalProperties: false,
                  type: 'object',
                  ...childSchema,
                })
                requiredFieldNames.add(tab.name)
              } else {
                Object.entries(childSchema.properties).forEach(([propName, propSchema]) => {
                  fieldSchemas.set(propName, propSchema)
                })
                childSchema.required.forEach((propName) => {
                  requiredFieldNames.add(propName)
                })
              }
            })
            break
          }

          case 'group': {
            fieldSchema = {
              additionalProperties: false,
              type: 'object',
              ...fieldsToJSONSchema(collectionIDFieldTypes, field.fields, interfaceNameDefinitions),
            }

            if (field.interfaceName) {
              interfaceNameDefinitions.set(field.interfaceName, fieldSchema)

              fieldSchema = {
                $ref: `#/definitions/${field.interfaceName}`,
              }
            }
            break
          }

          default: {
            break
          }
        }

        if (fieldSchema && fieldAffectsData(field)) {
          fieldSchemas.set(field.name, fieldSchema)
        }

        return fieldSchemas
      }, new Map<string, JSONSchema4>()),
    ),
    required: Array.from(requiredFieldNames),
  }
}

// This function is part of the public API and is exported through payload/utilities
export function entityToJSONSchema(
  config: SanitizedConfig,
  incomingEntity: SanitizedCollectionConfig | SanitizedGlobalConfig,
  interfaceNameDefinitions: Map<string, JSONSchema4>,
  defaultIDType: 'number' | 'text',
): JSONSchema4 {
  const entity: SanitizedCollectionConfig | SanitizedGlobalConfig = deepCopyObject(incomingEntity)
  const title = entity.typescript?.interface
    ? entity.typescript.interface
    : singular(toWords(entity.slug, true))

  const idField: FieldAffectingData = { name: 'id', required: true, type: defaultIDType as 'text' }
  const customIdField = entity.fields.find(
    (field) => fieldAffectsData(field) && field.name === 'id',
  ) as FieldAffectingData

  if (customIdField && customIdField.type !== 'group' && customIdField.type !== 'tab') {
    customIdField.required = true
  } else {
    entity.fields.unshift(idField)
  }

  // mark timestamp fields required
  if ('timestamps' in entity && entity.timestamps !== false) {
    entity.fields = entity.fields.map((field) => {
      if (fieldAffectsData(field) && (field.name === 'createdAt' || field.name === 'updatedAt')) {
        return {
          ...field,
          required: true,
        }
      }
      return field
    })
  }

  if ('auth' in entity && entity.auth && !entity.auth?.disableLocalStrategy) {
    entity.fields.push({
      name: 'password',
      type: 'text',
    })
  }

  // used for relationship fields, to determine whether to use a string or number type for the ID
  const collectionIDFieldTypes: { [key: string]: 'number' | 'string' } = config.collections.reduce(
    (acc, collection) => {
      const customCollectionIdField = collection.fields.find(
        (field) => 'name' in field && field.name === 'id',
      )

      acc[collection.slug] = defaultIDType === 'text' ? 'string' : 'number'

      if (customCollectionIdField) {
        acc[collection.slug] = customCollectionIdField.type === 'number' ? 'number' : 'string'
      }

      return acc
    },
    {},
  )

  return {
    additionalProperties: false,
    title,
    type: 'object',
    ...fieldsToJSONSchema(collectionIDFieldTypes, entity.fields, interfaceNameDefinitions),
  }
}

export function configToJSONSchema(
  config: SanitizedConfig,
  defaultIDType?: 'number' | 'text',
): JSONSchema4 {
  // a mutable Map to store custom top-level `interfaceName` types
  const interfaceNameDefinitions: Map<string, JSONSchema4> = new Map()
  const entityDefinitions: { [k: string]: JSONSchema4 } = [
    ...config.globals,
    ...config.collections,
  ].reduce((acc, entity) => {
    acc[entity.slug] = entityToJSONSchema(config, entity, interfaceNameDefinitions, defaultIDType)
    return acc
  }, {})

  return {
    additionalProperties: false,
    definitions: { ...entityDefinitions, ...Object.fromEntries(interfaceNameDefinitions) },
    properties: {
      collections: generateEntitySchemas(config.collections || []),
      globals: generateEntitySchemas(config.globals || []),
    },
    required: ['collections', 'globals'],
    title: 'Config',
    type: 'object',
  }
}
