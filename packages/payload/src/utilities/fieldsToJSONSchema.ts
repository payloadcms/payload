import type { JSONSchema4, JSONSchema4TypeName } from 'json-schema'

import type { SanitizedConfig } from '../config/types.js'

import { MissingEditorProp } from '../errors/MissingEditorProp.js'
import { type Field, fieldAffectsData, type Option, tabHasName } from '../fields/config/types.js'

/**
 * Returns a JSON Schema Type with 'null' added if the field is not required.
 */
export function withNullableJSONSchemaType(
  fieldType: JSONSchema4TypeName,
  isRequired: boolean,
): JSONSchema4TypeName | JSONSchema4TypeName[] {
  const fieldTypes = [fieldType]
  if (isRequired) {
    return fieldType
  }
  fieldTypes.push('null')
  return fieldTypes
}

const fieldIsRequired = (field: Field) => {
  const isConditional = Boolean(field?.admin && field?.admin?.condition)
  if (isConditional) {
    return false
  }

  const isMarkedRequired = 'required' in field && field.required === true
  if (fieldAffectsData(field) && isMarkedRequired) {
    return true
  }

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
        if (isRequired) {
          requiredFieldNames.add(field.name)
        }

        let fieldSchema: JSONSchema4

        switch (field.type) {
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
          case 'blocks': {
            // Check for a case where no blocks are provided.
            // We need to generate an empty array for this case, note that JSON schema 4 doesn't support empty arrays
            // so the best we can get is `unknown[]`
            const hasBlocks = Boolean(field.blocks.length)

            fieldSchema = {
              type: withNullableJSONSchemaType('array', isRequired),
              items: hasBlocks
                ? {
                    oneOf: field.blocks.map((block) => {
                      const blockFieldSchemas = fieldsToJSONSchema(
                        collectionIDFieldTypes,
                        block.fields,
                        interfaceNameDefinitions,
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
                  }
                : {},
            }
            break
          }
          case 'checkbox': {
            fieldSchema = { type: withNullableJSONSchemaType('boolean', isRequired) }
            break
          }
          case 'code':
          case 'date':
          case 'email':
          case 'textarea': {
            fieldSchema = { type: withNullableJSONSchemaType('string', isRequired) }
            break
          }

          case 'collapsible':
          case 'row': {
            const childSchema = fieldsToJSONSchema(
              collectionIDFieldTypes,
              field.fields,
              interfaceNameDefinitions,
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

          case 'group': {
            fieldSchema = {
              type: 'object',
              additionalProperties: false,
              ...fieldsToJSONSchema(
                collectionIDFieldTypes,
                field.fields,
                interfaceNameDefinitions,
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

          case 'join': {
            fieldSchema = {
              type: withNullableJSONSchemaType('object', false),
              additionalProperties: false,
              properties: {
                docs: {
                  type: withNullableJSONSchemaType('array', false),
                  items: {
                    oneOf: [
                      {
                        type: collectionIDFieldTypes[field.collection],
                      },
                      {
                        $ref: `#/definitions/${field.collection}`,
                      },
                    ],
                  },
                },
                hasNextPage: { type: withNullableJSONSchemaType('boolean', false) },
              },
            }
            break
          }

          case 'json': {
            fieldSchema = field.jsonSchema?.schema || {
              type: ['object', 'array', 'string', 'number', 'boolean', 'null'],
            }
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
          case 'radio': {
            fieldSchema = {
              type: withNullableJSONSchemaType('string', isRequired),
              enum: buildOptionEnums(field.options),
            }

            break
          }

          case 'relationship':
          case 'upload': {
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

          case 'richText': {
            if (!field?.editor) {
              throw new MissingEditorProp(field) // while we allow disabling editor functionality, you should not have any richText fields defined if you do not have an editor
            }
            if (typeof field.editor === 'function') {
              throw new Error('Attempted to access unsanitized rich text editor.')
            }
            if (field.editor.outputSchema) {
              fieldSchema = field.editor.outputSchema({
                collectionIDFieldTypes,
                config,
                field,
                interfaceNameDefinitions,
                isRequired,
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
          case 'select': {
            const optionEnums = buildOptionEnums(field.options)

            if (field.hasMany) {
              fieldSchema = {
                type: withNullableJSONSchemaType('array', isRequired),
                items: {
                  type: 'string',
                },
              }
              if (optionEnums?.length) {
                ;(fieldSchema.items as JSONSchema4).enum = optionEnums
              }
            } else {
              fieldSchema = {
                type: withNullableJSONSchemaType('string', isRequired),
              }
              if (optionEnums?.length) {
                fieldSchema.enum = optionEnums
              }
            }

            break
          }

          case 'tabs': {
            field.tabs.forEach((tab) => {
              const childSchema = fieldsToJSONSchema(
                collectionIDFieldTypes,
                tab.fields,
                interfaceNameDefinitions,
                config,
              )
              if (tabHasName(tab)) {
                // could have interface
                fieldSchemas.set(tab.name, {
                  type: 'object',
                  additionalProperties: false,
                  ...childSchema,
                })

                // If the named tab has any required fields then we mark this as required otherwise it should be optional
                const hasRequiredFields = tab.fields.some((subField) => fieldIsRequired(subField))

                if (hasRequiredFields) {
                  requiredFieldNames.add(tab.name)
                }
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

          default: {
            break
          }
        }

        if ('typescriptSchema' in field && field?.typescriptSchema?.length) {
          for (const schema of field.typescriptSchema) {
            fieldSchema = schema({ jsonSchema: fieldSchema })
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
