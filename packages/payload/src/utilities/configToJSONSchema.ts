import type { JSONSchema4, JSONSchema4TypeName } from 'json-schema'

import { singular } from 'pluralize'

import type { SanitizedCollectionConfig } from '../collections/config/types'
import type { SanitizedConfig } from '../exports/config'
import type { Field, FieldAffectingData, Option } from '../fields/config/types'
import type { SanitizedGlobalConfig } from '../globals/config/types'
import type { Payload } from '../payload'

import { fieldAffectsData, tabHasName } from '../fields/config/types'
import { deepCopyObject } from './deepCopyObject'
import { toWords } from './formatLabels'
import { getCollectionIDFieldTypes } from './getCollectionIDFieldTypes'

const fieldIsRequired = (field: Field) => {
  const isConditional = Boolean(field?.admin && field?.admin?.condition)
  if (isConditional) return false

  const isMarkedRequired = 'required' in field && field.required === true
  if (fieldAffectsData(field) && isMarkedRequired) return true

  // if any subfields are required, this field is required
  if ('fields' in field && field.type !== 'array') {
    return field.fields.some((subField) => fieldIsRequired(subField))
  }

  // if any tab subfields have required fields, this field is required
  if (field.type === 'tabs') {
    return field.tabs.some((tab) => {
      if ('name' in tab) {
        return tab.fields.some((subField) => fieldIsRequired(subField))
      }
      return false
    })
  }

  return false
}

function buildOptionEnums(options: Option[]): string[] {
  return options.map((option) => {
    if (typeof option === 'object' && 'value' in option) {
      return option.value
    }

    return option
  })
}

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
    type: 'object',
    additionalProperties: false,
    properties,
    required: Object.keys(properties),
  }
}

/**
 * Returns a JSON Schema Type with 'null' added if the field is not required.
 */
export function withNullableJSONSchemaType(
  fieldType: JSONSchema4TypeName,
  isRequired: boolean,
): JSONSchema4TypeName | JSONSchema4TypeName[] {
  const fieldTypes = [fieldType]
  if (isRequired) return fieldType
  fieldTypes.push('null')
  return fieldTypes
}

export function fieldsToJSONSchema(
  /**
   * Used for relationship fields, to determine whether to use a string or number type for the ID.
   * While there is a default ID field type set by the db adapter, they can differ on a collection-level
   * if they have custom ID fields.
   */
  collectionIDFieldTypes: { [key: string]: 'number' | 'string' },
  fields: Field[],
  /**
   * Allows you to define new top-level interfaces that can be re-used in the output schema.
   */
  interfaceNameDefinitions: Map<string, JSONSchema4>,
  payload?: Payload,
  config?: SanitizedConfig,
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
            if (field.hasMany === true) {
              fieldSchema = {
                type: withNullableJSONSchemaType('array', isRequired),
                items: { type: 'string' },
              }
            } else {
              fieldSchema = { type: withNullableJSONSchemaType('string', isRequired) }
            }
            break
          case 'textarea':
          case 'code':
          case 'email':
          case 'date': {
            fieldSchema = { type: withNullableJSONSchemaType('string', isRequired) }
            break
          }

          case 'number': {
            if (field.hasMany === true) {
              fieldSchema = {
                type: withNullableJSONSchemaType('array', isRequired),
                items: { type: 'number' },
              }
            } else {
              fieldSchema = { type: withNullableJSONSchemaType('number', isRequired) }
            }
            break
          }

          case 'checkbox': {
            fieldSchema = { type: withNullableJSONSchemaType('boolean', isRequired) }
            break
          }

          case 'json': {
            fieldSchema = {
              type: ['object', 'array', 'string', 'number', 'boolean', 'null'],
            }
            break
          }

          case 'richText': {
            if (field.editor.outputSchema) {
              fieldSchema = field.editor.outputSchema({
                collectionIDFieldTypes,
                config: config || payload?.config,
                field,
                interfaceNameDefinitions,
                isRequired,
                payload,
              })
            } else {
              // Maintain backwards compatibility with existing rich text editors
              fieldSchema = {
                type: withNullableJSONSchemaType('array', isRequired),
                items: {
                  type: 'object',
                },
              }
            }

            break
          }

          case 'radio': {
            fieldSchema = {
              type: withNullableJSONSchemaType('string', isRequired),
              enum: buildOptionEnums(field.options),
            }

            break
          }

          case 'select': {
            const optionEnums = buildOptionEnums(field.options)

            if (field.hasMany) {
              fieldSchema = {
                type: withNullableJSONSchemaType('array', isRequired),
                items: {
                  type: 'string',
                  enum: optionEnums,
                },
              }
            } else {
              fieldSchema = {
                type: withNullableJSONSchemaType('string', isRequired),
                enum: optionEnums,
              }
            }

            break
          }

          case 'point': {
            fieldSchema = {
              type: withNullableJSONSchemaType('array', isRequired),
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
            }
            break
          }

          case 'relationship': {
            if (Array.isArray(field.relationTo)) {
              if (field.hasMany) {
                fieldSchema = {
                  type: withNullableJSONSchemaType('array', isRequired),
                  items: {
                    oneOf: field.relationTo.map((relation) => {
                      return {
                        type: 'object',
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
                      }
                    }),
                  },
                }
              } else {
                fieldSchema = {
                  oneOf: field.relationTo.map((relation) => {
                    return {
                      type: withNullableJSONSchemaType('object', isRequired),
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
                    }
                  }),
                }
              }
            } else if (field.hasMany) {
              fieldSchema = {
                type: withNullableJSONSchemaType('array', isRequired),
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
              }
            } else {
              fieldSchema = {
                oneOf: [
                  {
                    type: withNullableJSONSchemaType(
                      collectionIDFieldTypes[field.relationTo],
                      isRequired,
                    ),
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
              type: withNullableJSONSchemaType('array', isRequired),
              items: {
                oneOf: field.blocks.map((block) => {
                  const blockFieldSchemas = fieldsToJSONSchema(
                    collectionIDFieldTypes,
                    block.fields,
                    interfaceNameDefinitions,
                    payload,
                    config,
                  )

                  const blockSchema: JSONSchema4 = {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      ...blockFieldSchemas.properties,
                      blockType: {
                        const: block.slug,
                      },
                    },
                    required: ['blockType', ...blockFieldSchemas.required],
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
            }
            break
          }

          case 'array': {
            fieldSchema = {
              type: withNullableJSONSchemaType('array', isRequired),
              items: {
                type: 'object',
                additionalProperties: false,
                ...fieldsToJSONSchema(
                  collectionIDFieldTypes,
                  field.fields,
                  interfaceNameDefinitions,
                  payload,
                  config,
                ),
              },
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
              payload,
              config,
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
                payload,
                config,
              )
              if (tabHasName(tab)) {
                // could have interface
                fieldSchemas.set(tab.name, {
                  type: 'object',
                  additionalProperties: false,
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
              type: 'object',
              additionalProperties: false,
              ...fieldsToJSONSchema(
                collectionIDFieldTypes,
                field.fields,
                interfaceNameDefinitions,
                payload,
                config,
              ),
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
  payload?: Payload,
): JSONSchema4 {
  const entity: SanitizedCollectionConfig | SanitizedGlobalConfig = deepCopyObject(incomingEntity)
  const title = entity.typescript?.interface
    ? entity.typescript.interface
    : singular(toWords(entity.slug, true))

  const idField: FieldAffectingData = { name: 'id', type: defaultIDType as 'text', required: true }
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

  //  Used for relationship fields, to determine whether to use a string or number type for the ID.
  const collectionIDFieldTypes = getCollectionIDFieldTypes({ config, defaultIDType })

  return {
    type: 'object',
    additionalProperties: false,
    title,
    ...fieldsToJSONSchema(
      collectionIDFieldTypes,
      entity.fields,
      interfaceNameDefinitions,
      payload,
      config,
    ),
  }
}

/**
 * This is used for generating the TypeScript types (payload-types.ts) with the payload generate:types command.
 */
export function configToJSONSchema(
  config: SanitizedConfig,
  defaultIDType?: 'number' | 'text',
  payload?: Payload,
): JSONSchema4 {
  // a mutable Map to store custom top-level `interfaceName` types. Fields with an `interfaceName` property will be moved to the top-level definitions here
  const interfaceNameDefinitions: Map<string, JSONSchema4> = new Map()

  // Collections and Globals have to be moved to the top-level definitions as well. Reason: The top-level type will be the `Config` type - we don't want all collection and global
  // types to be inlined inside the `Config` type
  const entityDefinitions: { [k: string]: JSONSchema4 } = [
    ...config.globals,
    ...config.collections,
  ].reduce((acc, entity) => {
    acc[entity.slug] = entityToJSONSchema(
      config,
      entity,
      interfaceNameDefinitions,
      defaultIDType,
      payload,
    )
    return acc
  }, {})

  return {
    additionalProperties: false,
    definitions: { ...entityDefinitions, ...Object.fromEntries(interfaceNameDefinitions) },
    // These properties here will be very simple, as all the complexity is in the definitions. These are just the properties for the top-level `Config` type
    type: 'object',
    properties: {
      collections: generateEntitySchemas(config.collections || []),
      globals: generateEntitySchemas(config.globals || []),
    },
    required: ['collections', 'globals'],
    title: 'Config',
  }
}
