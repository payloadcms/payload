import type { I18n } from '@payloadcms/translations'
import type { JSONSchema4, JSONSchema4TypeName } from 'json-schema'

import { createHash } from 'crypto'

import type { Auth } from '../auth/types.js'
import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'
import type { FieldAffectingData, FlattenedField, Option } from '../fields/config/types.js'
import type { SanitizedGlobalConfig } from '../globals/config/types.js'

import { MissingEditorProp } from '../errors/MissingEditorProp.js'
import { fieldAffectsData } from '../fields/config/types.js'
import { generateJobsJSONSchemas } from '../queues/config/generateJobsJSONSchemas.js'
import { flattenAllFields } from './flattenAllFields.js'
import { formatNames, toWords } from './formatLabels.js'
import { getCollectionIDFieldTypes } from './getCollectionIDFieldTypes.js'
import { optionsAreEqual } from './optionsAreEqual.js'

const fieldIsRequired = (field: FlattenedField): boolean => {
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
    return field.flattenedFields.some((subField) => fieldIsRequired(subField))
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
  const properties = [...entities].reduce(
    (acc, { slug }) => {
      acc[slug] = {
        $ref: `#/$defs/${slug}`,
      }

      return acc
    },
    {} as Record<string, JSONSchema4>,
  )

  return {
    type: 'object',
    additionalProperties: false,
    properties,
    required: Object.keys(properties),
  }
}

function generateEntitySelectSchemas(
  entities: (SanitizedCollectionConfig | SanitizedGlobalConfig)[],
): JSONSchema4 {
  const properties = [...entities].reduce(
    (acc, { slug }) => {
      acc[slug] = {
        $ref: `#/$defs/${slug}_select`,
      }

      return acc
    },
    {} as Record<string, JSONSchema4>,
  )

  return {
    type: 'object',
    additionalProperties: false,
    properties,
    required: Object.keys(properties),
  }
}

function generateCollectionJoinsSchemas(collections: SanitizedCollectionConfig[]): JSONSchema4 {
  const properties = [...collections].reduce<Record<string, JSONSchema4>>(
    (acc, { slug, joins, polymorphicJoins }) => {
      const schema = {
        type: 'object',
        additionalProperties: false,
        properties: {},
        required: [] as string[],
      } satisfies JSONSchema4

      for (const collectionSlug in joins) {
        for (const join of joins[collectionSlug]!) {
          ;(schema.properties as any)[join.joinPath] = {
            type: 'string',
            enum: [collectionSlug],
          }
          schema.required.push(join.joinPath)
        }
      }

      for (const join of polymorphicJoins) {
        ;(schema.properties as any)[join.joinPath] = {
          type: 'string',
          enum: join.field.collection,
        }
        schema.required.push(join.joinPath)
      }

      if (Object.keys(schema.properties).length > 0) {
        acc[slug] = schema
      }

      return acc
    },
    {},
  )

  return {
    type: 'object',
    additionalProperties: false,
    properties,
    required: Object.keys(properties),
  }
}

const widgetWidths = ['x-small', 'small', 'medium', 'large', 'x-large', 'full'] as const

function getAllowedWidgetWidths({
  maxWidth,
  minWidth,
}: {
  maxWidth?: (typeof widgetWidths)[number]
  minWidth?: (typeof widgetWidths)[number]
}): string[] {
  const minIndex = minWidth ? widgetWidths.indexOf(minWidth) : 0
  const maxIndex = maxWidth ? widgetWidths.indexOf(maxWidth) : widgetWidths.length - 1

  if (minIndex === -1 || maxIndex === -1 || minIndex > maxIndex) {
    return [...widgetWidths]
  }

  return widgetWidths.slice(minIndex, maxIndex + 1)
}

function generateWidgetSchemas({
  collectionIDFieldTypes,
  config,
  forceInlineBlocks,
  i18n,
  interfaceNameDefinitions,
  typeStringDefinitions,
}: {
  collectionIDFieldTypes: { [key: string]: 'number' | 'string' }
  config: SanitizedConfig
  forceInlineBlocks?: boolean
  i18n?: I18n
  interfaceNameDefinitions: Map<string, JSONSchema4>
  typeStringDefinitions: Set<string>
}): {
  definitions: Record<string, JSONSchema4>
  schema: JSONSchema4
} {
  const widgets = config.admin?.dashboard?.widgets ?? []
  const definitions: Record<string, JSONSchema4> = {}
  const properties: Record<string, JSONSchema4> = {}

  for (const widget of widgets) {
    const definition = `${widget.slug}_widget`
    const widthEnum = getAllowedWidgetWidths({
      maxWidth: widget.maxWidth,
      minWidth: widget.minWidth,
    })
    let dataSchema: JSONSchema4

    if (widget.fields?.length) {
      const widgetFieldSchemas = fieldsToJSONSchema({
        collectionIDFieldTypes,
        config,
        fields: flattenAllFields({ fields: widget.fields }),
        forceInlineBlocks,
        i18n,
        interfaceNameDefinitions,
        typeStringDefinitions,
      })

      dataSchema = {
        type: 'object',
        additionalProperties: false,
        ...widgetFieldSchemas,
      }
    } else {
      dataSchema = {
        type: 'object',
        additionalProperties: true,
      }
    }

    definitions[definition] = {
      type: 'object',
      additionalProperties: false,
      properties: {
        data: dataSchema,
        width: {
          type: 'string',
          enum: widthEnum,
        },
      },
      required: ['width'],
    }

    properties[widget.slug] = {
      $ref: `#/$defs/${definition}`,
    }
  }

  return {
    definitions,
    schema: {
      type: 'object',
      additionalProperties: false,
      properties,
      required: Object.keys(properties),
    },
  }
}

function generateLocaleEntitySchemas(localization: SanitizedConfig['localization']): JSONSchema4 {
  if (localization && 'locales' in localization && localization?.locales) {
    const localesFromConfig = localization?.locales

    const locales = [...localesFromConfig].map((locale) => {
      return locale.code
    }, [])

    return {
      type: 'string',
      enum: locales,
    }
  }

  return {
    type: 'null',
  }
}

function generateFallbackLocaleEntitySchemas(
  localization: SanitizedConfig['localization'],
): JSONSchema4 {
  if (localization && 'localeCodes' in localization && localization?.localeCodes) {
    const localeCodes = [...localization.localeCodes].map((localeCode) => {
      return localeCode
    }, [])

    return {
      oneOf: [
        { type: 'string', enum: ['false', 'none', 'null'] },
        { type: 'boolean', enum: [false] },
        { type: 'null' },
        { type: 'string', enum: localeCodes },
        { type: 'array', items: { type: 'string', enum: localeCodes } },
      ],
    }
  }

  return {
    type: 'null',
  }
}

function generateAuthEntitySchemas(entities: SanitizedCollectionConfig[]): JSONSchema4 {
  const properties: JSONSchema4[] = [...entities]
    .filter(({ auth }) => Boolean(auth))
    .map(({ slug }) => {
      return { $ref: `#/$defs/${slug}` }
    }, {})

  return {
    oneOf: properties,
  }
}

/**
 * Generates the JSON Schema for database configuration
 *
 * @example { db: idType: string }
 */
function generateDbEntitySchema(config: SanitizedConfig): JSONSchema4 {
  const defaultIDType: JSONSchema4 =
    config.db?.defaultIDType === 'number' ? { type: 'number' } : { type: 'string' }

  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      defaultIDType,
    },
    required: ['defaultIDType'],
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
  if (isRequired) {
    return fieldType
  }
  fieldTypes.push('null')
  return fieldTypes
}

function entityOrFieldToJsDocs({
  entity,
  i18n,
}: {
  entity: FlattenedField | SanitizedCollectionConfig | SanitizedGlobalConfig
  i18n?: I18n
}): string | undefined {
  let description: string | undefined = undefined
  if (entity?.admin?.description) {
    if (typeof entity?.admin?.description === 'string') {
      description = entity?.admin?.description
    } else if (typeof entity?.admin?.description === 'object') {
      if (entity?.admin?.description?.en) {
        description = entity?.admin?.description?.en
      } else if (entity?.admin?.description?.[i18n!.language]) {
        description = entity?.admin?.description?.[i18n!.language]
      }
    } else if (typeof entity?.admin?.description === 'function' && i18n) {
      // do not evaluate description functions for generating JSDocs. The output of
      // those can differ depending on where and when they are called, creating
      // inconsistencies in the generated JSDocs.
    }
  }
  return description
}

type ConfigToJSONSchemaOptions = {
  forceInlineBlocks?: boolean
}

export type FieldsToJSONSchemaArgs = {
  /**
   * Used for relationship fields, to determine whether to use a string or
   * number type for the ID. While there is a default ID field type set by
   * the db adapter, they can differ on a collection-level if they have
   * custom ID fields.
   */
  collectionIDFieldTypes: { [key: string]: 'number' | 'string' }
  config?: SanitizedConfig
  fields: FlattenedField[]
  /**
   * If true, blocks are inlined into each `block` field instead of being
   * lifted to a top-level definition. Used by the MCP plugin.
   */
  forceInlineBlocks?: boolean
  i18n?: I18n
  /** Allows you to define new top-level interfaces that can be re-used in the output schema. */
  interfaceNameDefinitions: Map<string, JSONSchema4>
  /**
   * Allows you to append raw TS source to `payload-types.ts`. Identical
   * strings de-dupe naturally, so the same helper written from many fields
   * ends up emitted once.
   */
  typeStringDefinitions: Set<string>
}

export function fieldsToJSONSchema({
  collectionIDFieldTypes,
  config,
  fields,
  forceInlineBlocks,
  i18n,
  interfaceNameDefinitions,
  typeStringDefinitions,
}: FieldsToJSONSchemaArgs): {
  properties: {
    [k: string]: JSONSchema4
  }
  required: string[]
} {
  const requiredFieldNames = new Set<string>()

  return {
    properties: Object.fromEntries(
      fields.reduce((fieldSchemas, field, index) => {
        const isRequired = fieldAffectsData(field) && fieldIsRequired(field)

        const fieldDescription = entityOrFieldToJsDocs({ entity: field, i18n })
        const baseFieldSchema: JSONSchema4 = {}
        if (fieldDescription) {
          baseFieldSchema.description = fieldDescription
        }

        let fieldSchema: JSONSchema4

        switch (field.type) {
          case 'array': {
            fieldSchema = {
              ...baseFieldSchema,
              type: withNullableJSONSchemaType('array', isRequired),
              items: {
                type: 'object',
                additionalProperties: false,
                ...fieldsToJSONSchema({
                  collectionIDFieldTypes,
                  config,
                  fields: field.flattenedFields,
                  forceInlineBlocks,
                  i18n,
                  interfaceNameDefinitions,
                  typeStringDefinitions,
                }),
              },
            }

            if (field.interfaceName) {
              interfaceNameDefinitions.set(field.interfaceName, fieldSchema)

              fieldSchema = {
                $ref: `#/$defs/${field.interfaceName}`,
              }
            }
            break
          }
          case 'blocks': {
            // Check for a case where no blocks are provided.
            // We need to generate an empty array for this case, note that JSON schema 4 doesn't support empty arrays
            // so the best we can get is `unknown[]`
            const hasBlocks = Boolean(
              field.blockReferences ? field.blockReferences.length : field.blocks.length,
            )

            fieldSchema = {
              ...baseFieldSchema,
              type: withNullableJSONSchemaType('array', isRequired),
              items: hasBlocks
                ? {
                    oneOf: (field.blockReferences ?? field.blocks).map((blockOrReference) => {
                      const block =
                        typeof blockOrReference === 'string'
                          ? config?.blocks?.find((b) => b.slug === blockOrReference)
                          : blockOrReference

                      if (!block) {
                        return {}
                      }

                      const blockFieldSchemas = fieldsToJSONSchema({
                        collectionIDFieldTypes,
                        config,
                        fields: block.flattenedFields,
                        forceInlineBlocks,
                        i18n,
                        interfaceNameDefinitions,
                        typeStringDefinitions,
                      })

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

                      return forceInlineBlocks
                        ? blockSchema
                        : {
                            $ref: `#/$defs/${registerBlockInterface(block, blockSchema, interfaceNameDefinitions)}`,
                          }
                    }),
                  }
                : {},
            }
            break
          }
          case 'checkbox': {
            fieldSchema = {
              ...baseFieldSchema,
              type: withNullableJSONSchemaType('boolean', isRequired),
            }
            break
          }
          case 'code':
          case 'date':
          case 'email':
          case 'textarea': {
            fieldSchema = {
              ...baseFieldSchema,
              type: withNullableJSONSchemaType('string', isRequired),
            }
            break
          }

          case 'group': {
            if (fieldAffectsData(field)) {
              fieldSchema = {
                ...baseFieldSchema,
                type: 'object',
                additionalProperties: false,
                ...fieldsToJSONSchema({
                  collectionIDFieldTypes,
                  config,
                  fields: field.flattenedFields,
                  forceInlineBlocks,
                  i18n,
                  interfaceNameDefinitions,
                  typeStringDefinitions,
                }),
              }

              if (field.interfaceName) {
                interfaceNameDefinitions.set(field.interfaceName, fieldSchema)

                fieldSchema = { $ref: `#/$defs/${field.interfaceName}` }
              }
            }
            break
          }

          case 'join': {
            let items: JSONSchema4

            if (Array.isArray(field.collection)) {
              items = {
                oneOf: field.collection.map((collection) => ({
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    relationTo: {
                      const: collection,
                    },
                    value: {
                      oneOf: [
                        {
                          type: collectionIDFieldTypes[collection],
                        },
                        {
                          $ref: `#/$defs/${collection}`,
                        },
                      ],
                    },
                  },
                  required: ['collectionSlug', 'value'],
                })),
              }
            } else {
              items = {
                oneOf: [
                  {
                    type: collectionIDFieldTypes[field.collection],
                  },
                  {
                    $ref: `#/$defs/${field.collection}`,
                  },
                ],
              }
            }

            fieldSchema = {
              ...baseFieldSchema,
              type: 'object',
              additionalProperties: false,
              properties: {
                docs: {
                  type: 'array',
                  items,
                },
                hasNextPage: { type: 'boolean' },
                totalDocs: { type: 'number' },
              },
            }
            break
          }

          case 'json': {
            fieldSchema = field.jsonSchema?.schema || {
              ...baseFieldSchema,
              type: ['object', 'array', 'string', 'number', 'boolean', 'null'],
            }
            break
          }

          case 'number': {
            if (field.hasMany === true) {
              fieldSchema = {
                ...baseFieldSchema,
                type: withNullableJSONSchemaType('array', isRequired),
                items: { type: 'number' },
              }
            } else {
              fieldSchema = {
                ...baseFieldSchema,
                type: withNullableJSONSchemaType('number', isRequired),
              }
            }
            break
          }

          case 'point': {
            fieldSchema = {
              ...baseFieldSchema,
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
              ...baseFieldSchema,
              type: withNullableJSONSchemaType('string', isRequired),
              enum: buildOptionEnums(field.options),
            }

            if (field.interfaceName) {
              interfaceNameDefinitions.set(field.interfaceName, fieldSchema)

              fieldSchema = {
                $ref: `#/$defs/${field.interfaceName}`,
              }
            }

            break
          }
          case 'relationship':
          case 'upload': {
            if (Array.isArray(field.relationTo)) {
              if (field.hasMany) {
                fieldSchema = {
                  ...baseFieldSchema,
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
                                $ref: `#/$defs/${relation}`,
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
                  ...baseFieldSchema,
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
                              $ref: `#/$defs/${relation}`,
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
                ...baseFieldSchema,
                type: withNullableJSONSchemaType('array', isRequired),
                items: {
                  oneOf: [
                    {
                      type: collectionIDFieldTypes[field.relationTo],
                    },
                    {
                      $ref: `#/$defs/${field.relationTo}`,
                    },
                  ],
                },
              }
            } else {
              fieldSchema = {
                ...baseFieldSchema,
                oneOf: [
                  {
                    type: withNullableJSONSchemaType(
                      collectionIDFieldTypes[field.relationTo]!,
                      isRequired,
                    ),
                  },
                  { $ref: `#/$defs/${field.relationTo}` },
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
            if (field.editor.jsonSchema) {
              fieldSchema = {
                ...baseFieldSchema,
                ...field.editor.jsonSchema({
                  collectionIDFieldTypes,
                  config,
                  field,
                  i18n,
                  interfaceNameDefinitions,
                  isRequired,
                  typeStringDefinitions,
                }),
              }
            } else {
              // Maintain backwards compatibility with existing rich text editors
              fieldSchema = {
                ...baseFieldSchema,
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
            // We get the previous field to check for a date in the case of a timezone select
            // This works because timezone selects are always inserted right after a date with 'timezone: true'
            const previousField = fields?.[index - 1]
            const isTimezoneField =
              previousField?.type === 'date' && previousField.timezone && field.name.includes('_tz')

            // Check if the timezone field's options match the global config's supported timezones
            const hasMatchingGlobalTimezones =
              isTimezoneField &&
              config &&
              optionsAreEqual(field.options, config.admin?.timezones?.supportedTimezones)

            // Timezone selects should reference the supportedTimezones definition
            // only if the field's options match the global config
            if (isTimezoneField && hasMatchingGlobalTimezones) {
              fieldSchema = {
                $ref: `#/$defs/supportedTimezones`,
              }
            } else {
              if (field.hasMany) {
                fieldSchema = {
                  ...baseFieldSchema,
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
                  ...baseFieldSchema,
                  type: withNullableJSONSchemaType('string', isRequired),
                }
                if (optionEnums?.length) {
                  fieldSchema.enum = optionEnums
                }
              }

              if (field.interfaceName) {
                interfaceNameDefinitions.set(field.interfaceName, fieldSchema)

                fieldSchema = {
                  $ref: `#/$defs/${field.interfaceName}`,
                }
              }
              break
            }

            break
          }
          case 'tab': {
            fieldSchema = {
              ...baseFieldSchema,
              type: 'object',
              additionalProperties: false,
              ...fieldsToJSONSchema({
                collectionIDFieldTypes,
                config,
                fields: field.flattenedFields,
                forceInlineBlocks,
                i18n,
                interfaceNameDefinitions,
                typeStringDefinitions,
              }),
            }

            if (field.interfaceName) {
              interfaceNameDefinitions.set(field.interfaceName, fieldSchema)

              fieldSchema = { $ref: `#/$defs/${field.interfaceName}` }
            }
            break
          }

          case 'text':
            if (field.hasMany === true) {
              fieldSchema = {
                ...baseFieldSchema,
                type: withNullableJSONSchemaType('array', isRequired),
                items: { type: 'string' },
              }
            } else {
              fieldSchema = {
                ...baseFieldSchema,
                type: withNullableJSONSchemaType('string', isRequired),
              }
            }
            break

          default: {
            break
          }
        }

        if ('jsonSchema' in field && field?.jsonSchema?.length) {
          for (const schema of field.jsonSchema) {
            fieldSchema = schema({ jsonSchema: fieldSchema! })
          }
        }

        if (fieldSchema! && fieldAffectsData(field)) {
          if (isRequired && fieldSchema.required !== false) {
            requiredFieldNames.add(field.name)
          }
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
  entity: SanitizedCollectionConfig | SanitizedGlobalConfig,
  interfaceNameDefinitions: Map<string, JSONSchema4>,
  defaultIDType: 'number' | 'text',
  typeStringDefinitions: Set<string>,
  collectionIDFieldTypes?: { [key: string]: 'number' | 'string' },
  i18n?: I18n,
  forceInlineBlocks?: boolean,
): JSONSchema4 {
  if (!collectionIDFieldTypes) {
    collectionIDFieldTypes = getCollectionIDFieldTypes({ config, defaultIDType })
  }

  const title = entity.typescript?.interface
    ? entity.typescript.interface
    : formatNames(entity.slug).singular

  let mutableFields = [...entity.flattenedFields]

  const idField: FieldAffectingData = { name: 'id', type: defaultIDType as 'text', required: true }
  const customIdField = mutableFields.find((field) => field.name === 'id') as FieldAffectingData

  if (customIdField && customIdField.type !== 'group' && customIdField.type !== 'tab') {
    mutableFields = mutableFields.map((field) => {
      if (field === customIdField) {
        return { ...field, required: true }
      }

      return field
    })
  } else {
    mutableFields.unshift(idField)
  }

  // mark timestamp fields required
  if ('timestamps' in entity && entity.timestamps !== false) {
    mutableFields = mutableFields.map((field) => {
      if (field.name === 'createdAt' || field.name === 'updatedAt') {
        return {
          ...field,
          required: true,
        }
      }
      return field
    })
  }

  if (
    'auth' in entity &&
    entity.auth &&
    (!entity.auth?.disableLocalStrategy ||
      (typeof entity.auth?.disableLocalStrategy === 'object' &&
        entity.auth.disableLocalStrategy.enableFields))
  ) {
    mutableFields.push({
      name: 'password',
      type: 'text',
    })
  }

  const isAuthCollection = 'auth' in entity && entity.auth

  const fieldsSchema = fieldsToJSONSchema({
    collectionIDFieldTypes,
    config,
    fields: mutableFields,
    forceInlineBlocks,
    i18n,
    interfaceNameDefinitions,
    typeStringDefinitions,
  })

  // Add collection property to auth collections
  if (isAuthCollection) {
    fieldsSchema.properties = {
      ...fieldsSchema.properties,
      collection: { type: 'string', enum: [entity.slug] },
    }
    fieldsSchema.required = [...(fieldsSchema.required || []), 'collection']
  }

  const jsonSchema: JSONSchema4 = {
    type: 'object',
    additionalProperties: false,
    title,
    ...fieldsSchema,
  }

  const entityDescription = entityOrFieldToJsDocs({ entity, i18n })

  if (entityDescription) {
    jsonSchema.description = entityDescription
  }

  return jsonSchema
}

/**
 * Like {@link entityToJSONSchema}, but returns a standalone schema for one collection or global:
 * the entity plus only the `$defs` it actually uses, so it resolves on its own rather than
 * as part of the whole config schema.
 *
 * Relationship/upload `$ref`s to other collections are left in place - the caller handles those.
 */
export function entityToStandaloneJSONSchema({
  config,
  defaultIDType,
  entity,
  i18n,
}: {
  config: SanitizedConfig
  defaultIDType: 'number' | 'text'
  entity: SanitizedCollectionConfig | SanitizedGlobalConfig
  i18n?: I18n
}): JSONSchema4 {
  const definitions = new Map<string, JSONSchema4>()

  // entityToJSONSchema fills `definitions` with everything the fields reference (node unions, blocks).
  const schema = entityToJSONSchema(
    config,
    entity,
    definitions,
    defaultIDType,
    new Set(),
    undefined,
    i18n,
    true, // forceInlineBlocks
  )

  // Timezone fields `$ref` supportedTimezones, which lives on the root config schema, so add it here.
  const supportedTimezones = config.admin?.timezones?.supportedTimezones
  if (
    supportedTimezones?.length &&
    schemaHasRef([schema, ...definitions.values()], '#/$defs/supportedTimezones')
  ) {
    definitions.set('supportedTimezones', timezonesToJSONSchema(supportedTimezones))
  }

  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    ...schema,
    $defs: Object.fromEntries(definitions),
  }
}

/**
 * Recursive function that returns true if
 * `node` has a `$ref` to `ref` somewhere inside it.
 * */
function schemaHasRef(node: unknown, ref: string): boolean {
  if (Array.isArray(node)) {
    return node.some((child) => schemaHasRef(child, ref))
  }
  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>
    if (obj.$ref === ref) {
      return true
    }
    return Object.values(obj).some((value) => schemaHasRef(value, ref))
  }
  return false
}

export function fieldsToSelectJSONSchema({
  config,
  fields,
  interfaceNameDefinitions,
}: {
  config: SanitizedConfig
  fields: FlattenedField[]
  interfaceNameDefinitions: Map<string, JSONSchema4>
}): JSONSchema4 {
  const schema: JSONSchema4 = {
    type: 'object',
    additionalProperties: false,
    properties: {},
  }

  for (const field of fields) {
    switch (field.type) {
      case 'array':
      case 'group':
      case 'tab': {
        let fieldSchema: JSONSchema4 = fieldsToSelectJSONSchema({
          config,
          fields: field.flattenedFields,
          interfaceNameDefinitions,
        })

        if (field.interfaceName) {
          const definition = `${field.interfaceName}_select`
          interfaceNameDefinitions.set(definition, fieldSchema)

          fieldSchema = {
            $ref: `#/$defs/${definition}`,
          }
        }

        schema.properties![field.name] = {
          oneOf: [
            {
              type: 'boolean',
            },
            fieldSchema,
          ],
        }

        break
      }

      case 'blocks': {
        const blocksSchema: JSONSchema4 = {
          type: 'object',
          additionalProperties: false,
          properties: {},
        }

        for (const block of field.blockReferences ?? field.blocks) {
          if (typeof block === 'string') {
            continue // TODO
          }

          let blockSchema = fieldsToSelectJSONSchema({
            config,
            fields: block.flattenedFields,
            interfaceNameDefinitions,
          })

          if (block.interfaceName) {
            const definition = `${block.interfaceName}_select`
            interfaceNameDefinitions.set(definition, blockSchema)
            blockSchema = {
              $ref: `#/$defs/${definition}`,
            }
          }

          blocksSchema.properties![block.slug] = {
            oneOf: [
              {
                type: 'boolean',
              },
              blockSchema,
            ],
          }
        }

        schema.properties![field.name] = {
          oneOf: [
            {
              type: 'boolean',
            },
            blocksSchema,
          ],
        }

        break
      }

      default:
        schema.properties![field.name] = {
          type: 'boolean',
        }
        break
    }
  }

  return schema
}

const fieldType: JSONSchema4 = {
  type: 'string',
  required: false,
}
const generateAuthFieldTypes = ({
  type,
  loginWithUsername,
}: {
  loginWithUsername: Auth['loginWithUsername']
  type: 'forgotOrUnlock' | 'login' | 'register'
}): JSONSchema4 => {
  if (loginWithUsername) {
    switch (type) {
      case 'forgotOrUnlock': {
        if (loginWithUsername.allowEmailLogin) {
          // allow email or username for unlock/forgot-password
          return {
            additionalProperties: false,
            oneOf: [
              {
                additionalProperties: false,
                properties: { email: fieldType },
                required: ['email'],
              },
              {
                additionalProperties: false,
                properties: { username: fieldType },
                required: ['username'],
              },
            ],
          }
        } else {
          // allow only username for unlock/forgot-password
          return {
            additionalProperties: false,
            properties: { username: fieldType },
            required: ['username'],
          }
        }
      }

      case 'login': {
        if (loginWithUsername.allowEmailLogin) {
          // allow username or email and require password for login
          return {
            additionalProperties: false,
            oneOf: [
              {
                additionalProperties: false,
                properties: { email: fieldType, password: fieldType },
                required: ['email', 'password'],
              },
              {
                additionalProperties: false,
                properties: { password: fieldType, username: fieldType },
                required: ['username', 'password'],
              },
            ],
          }
        } else {
          // allow only username and password for login
          return {
            additionalProperties: false,
            properties: {
              password: fieldType,
              username: fieldType,
            },
            required: ['username', 'password'],
          }
        }
      }

      case 'register': {
        const requiredFields: ('email' | 'password' | 'username')[] = ['password']
        const properties: {
          email?: JSONSchema4['properties']
          password?: JSONSchema4['properties']
          username?: JSONSchema4['properties']
        } = {
          password: fieldType,
          username: fieldType,
        }

        if (loginWithUsername.requireEmail) {
          requiredFields.push('email')
        }
        if (loginWithUsername.requireUsername) {
          requiredFields.push('username')
        }
        if (loginWithUsername.requireEmail || loginWithUsername.allowEmailLogin) {
          properties.email = fieldType
        }

        return {
          additionalProperties: false,
          properties,
          required: requiredFields,
        }
      }
    }
  }

  // default email (and password for login/register)
  return {
    additionalProperties: false,
    properties: { email: fieldType, password: fieldType },
    required: ['email', 'password'],
  }
}

export function authCollectionToOperationsJSONSchema(
  config: SanitizedCollectionConfig,
): JSONSchema4 {
  const loginWithUsername = config.auth?.loginWithUsername
  const loginUserFields: JSONSchema4 = generateAuthFieldTypes({ type: 'login', loginWithUsername })
  const forgotOrUnlockUserFields: JSONSchema4 = generateAuthFieldTypes({
    type: 'forgotOrUnlock',
    loginWithUsername,
  })
  const registerUserFields: JSONSchema4 = generateAuthFieldTypes({
    type: 'register',
    loginWithUsername,
  })

  const properties: JSONSchema4['properties'] = {
    forgotPassword: forgotOrUnlockUserFields,
    login: loginUserFields,
    registerFirstUser: registerUserFields,
    unlock: forgotOrUnlockUserFields,
  }

  return {
    type: 'object',
    additionalProperties: false,
    properties,
    required: Object.keys(properties),
    title: `${formatNames(config.slug).singular}AuthOperations`,
  }
}

// Generates the JSON Schema for supported timezones
export function timezonesToJSONSchema(
  supportedTimezones: SanitizedConfig['admin']['timezones']['supportedTimezones'],
): JSONSchema4 {
  return {
    description: 'Supported timezones in IANA format.',
    enum: supportedTimezones.map((timezone) =>
      typeof timezone === 'string' ? timezone : timezone.value,
    ),
  }
}

function generateAuthOperationSchemas(collections: SanitizedCollectionConfig[]): JSONSchema4 {
  const properties = collections.reduce(
    (acc, collection) => {
      if (collection.auth) {
        acc[collection.slug] = {
          $ref: `#/$defs/auth/${collection.slug}`,
        }
      }
      return acc
    },
    {} as Record<string, JSONSchema4>,
  )

  return {
    type: 'object',
    additionalProperties: false,
    properties,
    required: Object.keys(properties),
  }
}

const hashBlockSchema = (schema: JSONSchema4): string =>
  createHash('sha256').update(JSON.stringify(schema)).digest('hex').slice(0, 8).toUpperCase()

/**
 * Registers a block's schema as a top-level definition and returns its name.
 *
 * The name is the block's `interfaceName`, or a PascalCase form of its slug. If a different block
 * already uses that name - whether it was auto-generated or an explicit `interfaceName` - this one
 * gets a content-hash suffix (`Hero_3F2A1B0C`) so the two don't overwrite each other. Registering
 * the same block shape again reuses its name.
 */
export function registerBlockInterface(
  block: { interfaceName?: string; slug: string },
  blockSchema: JSONSchema4,
  interfaceNameDefinitions: Map<string, JSONSchema4>,
): string {
  const baseName = block.interfaceName ?? toWords(block.slug, true)
  const existing = interfaceNameDefinitions.get(baseName)

  // The name is free - claim it.
  if (!existing) {
    interfaceNameDefinitions.set(baseName, blockSchema)
    return baseName
  }

  const hash = hashBlockSchema(blockSchema)

  // The same block shape is already registered under this name, so reuse it.
  if (hashBlockSchema(existing) === hash) {
    return baseName
  }

  // A different block already owns the name. Disambiguate this one with its hash.
  blockSchema.description = `Multiple blocks resolve to the \`${baseName}\` interface with different fields, so a content hash is appended to keep the generated types stable and unambiguous. Set a unique \`interfaceName\` on the block to choose the name yourself. See https://payloadcms.com/docs/typescript/generating-types#block-interface-name-collisions`

  const uniqueName = `${baseName}_${hash}`
  interfaceNameDefinitions.set(uniqueName, blockSchema)
  return uniqueName
}

/**
 * This is used for generating the TypeScript types (payload-types.ts) with the payload generate:types command.
 */
export function configToJSONSchema(
  config: SanitizedConfig,
  defaultIDType?: 'number' | 'text',
  i18n?: I18n,
  { forceInlineBlocks }: ConfigToJSONSchemaOptions = {},
): { jsonSchema: JSONSchema4; typeStringDefinitions: Set<string> } {
  // a mutable Map of top-level definitions in the generated JSON Schema.
  // - `array`/`group`/named-`tab` fields are registered here when they set
  //   `interfaceName` (otherwise they stay inline).
  // - `block` configs always register here via `registerBlockInterface`, keyed by
  //   `block.interfaceName` if set, else a PascalCase form of the slug (with a
  //   content-hash suffix when two different blocks resolve to the same name).
  const interfaceNameDefinitions: Map<string, JSONSchema4> = new Map()
  // a mutable Set for raw TS source to be appended to `payload-types.ts`.
  const typeStringDefinitions: Set<string> = new Set()

  //  Used for relationship fields, to determine whether to use a string or number type for the ID.
  const collectionIDFieldTypes = getCollectionIDFieldTypes({
    config,
    defaultIDType: defaultIDType!,
  })

  // Collections and Globals have to be moved to the top-level definitions as well. Reason: The top-level type will be the `Config` type - we don't want all collection and global
  // types to be inlined inside the `Config` type

  const entities: {
    entity: SanitizedCollectionConfig | SanitizedGlobalConfig
    type: 'collection' | 'global'
  }[] = [
    ...config.globals.map((global) => ({ type: 'global' as const, entity: global })),
    ...config.collections.map((collection) => ({
      type: 'collection' as const,
      entity: collection,
    })),
  ]

  const entityDefinitions: { [k: string]: JSONSchema4 } = entities.reduce(
    (acc, { type, entity }) => {
      acc[entity.slug] = entityToJSONSchema(
        config,
        entity,
        interfaceNameDefinitions,
        defaultIDType!,
        typeStringDefinitions,
        collectionIDFieldTypes,
        i18n,
        forceInlineBlocks,
      )
      const select = fieldsToSelectJSONSchema({
        config,
        fields: entity.flattenedFields,
        interfaceNameDefinitions,
      })

      if (type === 'global') {
        select.properties!.globalType = {
          type: 'boolean',
        }
      }

      acc[`${entity.slug}_select`] = {
        type: 'object',
        additionalProperties: false,
        ...select,
      }

      return acc
    },
    {} as Record<string, JSONSchema4>,
  )

  const timezoneDefinitions = timezonesToJSONSchema(config.admin.timezones.supportedTimezones)
  const widgetSchemas = generateWidgetSchemas({
    collectionIDFieldTypes,
    config,
    forceInlineBlocks,
    i18n,
    interfaceNameDefinitions,
    typeStringDefinitions,
  })

  const authOperationDefinitions = [...config.collections]
    .filter(({ auth }) => Boolean(auth))
    .reduce(
      (acc, authCollection) => {
        acc.auth[authCollection.slug] = authCollectionToOperationsJSONSchema(authCollection)
        return acc
      },
      { auth: {} as Record<string, JSONSchema4> },
    )

  const jobsSchemas = config.jobs
    ? generateJobsJSONSchemas(
        config,
        config.jobs,
        interfaceNameDefinitions,
        collectionIDFieldTypes,
        typeStringDefinitions,
        i18n,
      )
    : {}

  const blocksDefinition: JSONSchema4 | undefined = {
    type: 'object',
    additionalProperties: false,
    properties: {},
    required: [],
  }
  if (config?.blocks?.length) {
    for (const block of config.blocks) {
      const blockFieldSchemas = fieldsToJSONSchema({
        collectionIDFieldTypes,
        config,
        fields: block.flattenedFields,
        forceInlineBlocks,
        i18n,
        interfaceNameDefinitions,
        typeStringDefinitions,
      })

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

      blocksDefinition.properties![block.slug] = {
        $ref: `#/$defs/${registerBlockInterface(block, blockSchema, interfaceNameDefinitions)}`,
      }
      ;(blocksDefinition.required as string[]).push(block.slug)
    }
  }

  let jsonSchema: JSONSchema4 = {
    $defs: {
      supportedTimezones: timezoneDefinitions,
      ...entityDefinitions,
      ...widgetSchemas.definitions,
      ...Object.fromEntries(interfaceNameDefinitions),
      ...authOperationDefinitions,
    },
    additionalProperties: false,
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
      widgets: widgetSchemas.schema,
      ...(config.typescript?.strictDraftTypes
        ? {
            strictDraftTypes: {
              type: 'boolean',
              const: true,
            },
          }
        : {}),
      user: generateAuthEntitySchemas(config.collections),
    },
    required: [
      'user',
      'locale',
      'fallbackLocale',
      'collections',
      'collectionsSelect',
      'collectionsJoins',
      'globalsSelect',
      ...(config.typescript?.strictDraftTypes ? ['strictDraftTypes'] : []),
      'globals',
      'auth',
      'db',
      'jobs',
      'blocks',
      'widgets',
    ],
    title: 'Config',
  }

  if (jobsSchemas.definitions?.size) {
    for (const [key, value] of jobsSchemas.definitions) {
      jsonSchema.$defs![key] = value
    }
  }
  if (jobsSchemas.properties) {
    jsonSchema.properties!.jobs = {
      type: 'object',
      additionalProperties: false,
      properties: jobsSchemas.properties,
      required: ['tasks', 'workflows'],
    }
  }

  if (config?.typescript?.schema?.length) {
    for (const schema of config.typescript.schema) {
      jsonSchema = schema({ collectionIDFieldTypes, config, i18n: i18n!, jsonSchema })
    }
  }

  return { jsonSchema, typeStringDefinitions }
}
