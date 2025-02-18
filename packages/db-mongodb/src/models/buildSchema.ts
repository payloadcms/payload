import type { IndexOptions, Schema, SchemaOptions, SchemaTypeOptions } from 'mongoose'

import mongoose from 'mongoose'
import {
  type ArrayField,
  type BlocksField,
  type CheckboxField,
  type CodeField,
  type CollapsibleField,
  type DateField,
  type EmailField,
  type Field,
  type FieldAffectingData,
  type GroupField,
  type JSONField,
  type NonPresentationalField,
  type NumberField,
  type Payload,
  type PointField,
  type RadioField,
  type RelationshipField,
  type RichTextField,
  type RowField,
  type SanitizedLocalizationConfig,
  type SelectField,
  type Tab,
  type TabsField,
  type TextareaField,
  type TextField,
  type UploadField,
} from 'payload'
import {
  fieldAffectsData,
  fieldIsPresentationalOnly,
  fieldIsVirtual,
  fieldShouldBeLocalized,
  tabHasName,
} from 'payload/shared'

export type BuildSchemaOptions = {
  allowIDField?: boolean
  disableUnique?: boolean
  draftsEnabled?: boolean
  indexSortableFields?: boolean
  options?: SchemaOptions
}

type FieldSchemaGenerator = (
  field: Field,
  schema: Schema,
  config: Payload,
  buildSchemaOptions: BuildSchemaOptions,
  parentIsLocalized: boolean,
) => void

/**
 * get a field's defaultValue only if defined and not dynamic so that it can be set on the field schema
 * @param field
 */
const formatDefaultValue = (field: FieldAffectingData) =>
  typeof field.defaultValue !== 'undefined' && typeof field.defaultValue !== 'function'
    ? field.defaultValue
    : undefined

const formatBaseSchema = ({
  buildSchemaOptions,
  field,
  parentIsLocalized,
}: {
  buildSchemaOptions: BuildSchemaOptions
  field: FieldAffectingData
  parentIsLocalized: boolean
}) => {
  const { disableUnique, draftsEnabled, indexSortableFields } = buildSchemaOptions
  const schema: SchemaTypeOptions<unknown> = {
    default: formatDefaultValue(field),
    index: field.index || (!disableUnique && field.unique) || indexSortableFields || false,
    required: false,
    unique: (!disableUnique && field.unique) || false,
  }

  if (
    schema.unique &&
    (fieldShouldBeLocalized({ field, parentIsLocalized }) ||
      draftsEnabled ||
      (fieldAffectsData(field) &&
        field.type !== 'group' &&
        field.type !== 'tab' &&
        field.required !== true))
  ) {
    schema.sparse = true
  }

  if (field.hidden) {
    schema.hidden = true
  }

  return schema
}

const localizeSchema = (
  entity: NonPresentationalField | Tab,
  schema,
  localization: false | SanitizedLocalizationConfig,
  parentIsLocalized: boolean,
) => {
  if (
    fieldShouldBeLocalized({ field: entity, parentIsLocalized }) &&
    localization &&
    Array.isArray(localization.locales)
  ) {
    return {
      type: localization.localeCodes.reduce(
        (localeSchema, locale) => ({
          ...localeSchema,
          [locale]: schema,
        }),
        {
          _id: false,
        },
      ),
      localized: true,
    }
  }
  return schema
}

export const buildSchema = (args: {
  buildSchemaOptions: BuildSchemaOptions
  configFields: Field[]
  parentIsLocalized?: boolean
  payload: Payload
}): Schema => {
  const { buildSchemaOptions = {}, configFields, parentIsLocalized, payload } = args
  const { allowIDField, options } = buildSchemaOptions
  let fields = {}

  let schemaFields = configFields

  if (!allowIDField) {
    const idField = schemaFields.find((field) => fieldAffectsData(field) && field.name === 'id')
    if (idField) {
      fields = {
        _id: idField.type === 'number' ? Number : String,
      }
      schemaFields = schemaFields.filter(
        (field) => !(fieldAffectsData(field) && field.name === 'id'),
      )
    }
  }

  const schema = new mongoose.Schema(fields, options)

  schemaFields.forEach((field) => {
    if (fieldIsVirtual(field)) {
      return
    }

    if (!fieldIsPresentationalOnly(field)) {
      const addFieldSchema: FieldSchemaGenerator = fieldToSchemaMap[field.type]

      if (addFieldSchema) {
        addFieldSchema(field, schema, payload, buildSchemaOptions, parentIsLocalized)
      }
    }
  })

  return schema
}

const fieldToSchemaMap: Record<string, FieldSchemaGenerator> = {
  array: (field: ArrayField, schema, payload, buildSchemaOptions, parentIsLocalized) => {
    const baseSchema = {
      ...formatBaseSchema({ buildSchemaOptions, field, parentIsLocalized }),
      type: [
        buildSchema({
          buildSchemaOptions: {
            allowIDField: true,
            disableUnique: buildSchemaOptions.disableUnique,
            draftsEnabled: buildSchemaOptions.draftsEnabled,
            options: {
              _id: false,
              id: false,
              minimize: false,
            },
          },
          configFields: field.fields,
          parentIsLocalized: parentIsLocalized || field.localized,
          payload,
        }),
      ],
    }

    schema.add({
      [field.name]: localizeSchema(
        field,
        baseSchema,
        payload.config.localization,
        parentIsLocalized,
      ),
    })
  },
  blocks: (field: BlocksField, schema, payload, buildSchemaOptions, parentIsLocalized): void => {
    const fieldSchema = {
      type: [new mongoose.Schema({}, { _id: false, discriminatorKey: 'blockType' })],
    }

    schema.add({
      [field.name]: localizeSchema(
        field,
        fieldSchema,
        payload.config.localization,
        parentIsLocalized,
      ),
    })
    ;(field.blockReferences ?? field.blocks).forEach((blockItem) => {
      const blockSchema = new mongoose.Schema({}, { _id: false, id: false })

      const block = typeof blockItem === 'string' ? payload.blocks[blockItem] : blockItem

      block.fields.forEach((blockField) => {
        const addFieldSchema: FieldSchemaGenerator = fieldToSchemaMap[blockField.type]
        if (addFieldSchema) {
          addFieldSchema(
            blockField,
            blockSchema,
            payload,
            buildSchemaOptions,
            parentIsLocalized || field.localized,
          )
        }
      })

      if (fieldShouldBeLocalized({ field, parentIsLocalized }) && payload.config.localization) {
        payload.config.localization.localeCodes.forEach((localeCode) => {
          // @ts-expect-error Possible incorrect typing in mongoose types, this works
          schema.path(`${field.name}.${localeCode}`).discriminator(block.slug, blockSchema)
        })
      } else {
        // @ts-expect-error Possible incorrect typing in mongoose types, this works
        schema.path(field.name).discriminator(block.slug, blockSchema)
      }
    })
  },
  checkbox: (
    field: CheckboxField,
    schema,
    payload,
    buildSchemaOptions,
    parentIsLocalized,
  ): void => {
    const baseSchema = {
      ...formatBaseSchema({ buildSchemaOptions, field, parentIsLocalized }),
      type: Boolean,
    }

    schema.add({
      [field.name]: localizeSchema(
        field,
        baseSchema,
        payload.config.localization,
        parentIsLocalized,
      ),
    })
  },
  code: (field: CodeField, schema, payload, buildSchemaOptions, parentIsLocalized): void => {
    const baseSchema = {
      ...formatBaseSchema({ buildSchemaOptions, field, parentIsLocalized }),
      type: String,
    }

    schema.add({
      [field.name]: localizeSchema(
        field,
        baseSchema,
        payload.config.localization,
        parentIsLocalized,
      ),
    })
  },
  collapsible: (
    field: CollapsibleField,
    schema,
    payload,
    buildSchemaOptions,
    parentIsLocalized,
  ): void => {
    field.fields.forEach((subField: Field) => {
      if (fieldIsVirtual(subField)) {
        return
      }

      const addFieldSchema: FieldSchemaGenerator = fieldToSchemaMap[subField.type]

      if (addFieldSchema) {
        addFieldSchema(subField, schema, payload, buildSchemaOptions, parentIsLocalized)
      }
    })
  },
  date: (field: DateField, schema, payload, buildSchemaOptions, parentIsLocalized): void => {
    const baseSchema = {
      ...formatBaseSchema({ buildSchemaOptions, field, parentIsLocalized }),
      type: Date,
    }

    schema.add({
      [field.name]: localizeSchema(
        field,
        baseSchema,
        payload.config.localization,
        parentIsLocalized,
      ),
    })
  },
  email: (field: EmailField, schema, payload, buildSchemaOptions, parentIsLocalized): void => {
    const baseSchema = {
      ...formatBaseSchema({ buildSchemaOptions, field, parentIsLocalized }),
      type: String,
    }

    schema.add({
      [field.name]: localizeSchema(
        field,
        baseSchema,
        payload.config.localization,
        parentIsLocalized,
      ),
    })
  },
  group: (field: GroupField, schema, payload, buildSchemaOptions, parentIsLocalized): void => {
    const formattedBaseSchema = formatBaseSchema({ buildSchemaOptions, field, parentIsLocalized })

    // carry indexSortableFields through to versions if drafts enabled
    const indexSortableFields =
      buildSchemaOptions.indexSortableFields &&
      field.name === 'version' &&
      buildSchemaOptions.draftsEnabled

    const baseSchema = {
      ...formattedBaseSchema,
      type: buildSchema({
        buildSchemaOptions: {
          disableUnique: buildSchemaOptions.disableUnique,
          draftsEnabled: buildSchemaOptions.draftsEnabled,
          indexSortableFields,
          options: {
            _id: false,
            id: false,
            minimize: false,
          },
        },
        configFields: field.fields,
        parentIsLocalized: parentIsLocalized || field.localized,
        payload,
      }),
    }

    schema.add({
      [field.name]: localizeSchema(
        field,
        baseSchema,
        payload.config.localization,
        parentIsLocalized,
      ),
    })
  },
  json: (field: JSONField, schema, payload, buildSchemaOptions, parentIsLocalized): void => {
    const baseSchema = {
      ...formatBaseSchema({ buildSchemaOptions, field, parentIsLocalized }),
      type: mongoose.Schema.Types.Mixed,
    }

    schema.add({
      [field.name]: localizeSchema(
        field,
        baseSchema,
        payload.config.localization,
        parentIsLocalized,
      ),
    })
  },
  number: (field: NumberField, schema, payload, buildSchemaOptions, parentIsLocalized): void => {
    const baseSchema = {
      ...formatBaseSchema({ buildSchemaOptions, field, parentIsLocalized }),
      type: field.hasMany ? [Number] : Number,
    }

    schema.add({
      [field.name]: localizeSchema(
        field,
        baseSchema,
        payload.config.localization,
        parentIsLocalized,
      ),
    })
  },
  point: (field: PointField, schema, payload, buildSchemaOptions, parentIsLocalized): void => {
    const baseSchema: SchemaTypeOptions<unknown> = {
      type: {
        type: String,
        enum: ['Point'],
        ...(typeof field.defaultValue !== 'undefined' && {
          default: 'Point',
        }),
      },
      coordinates: {
        type: [Number],
        default: formatDefaultValue(field),
        required: false,
      },
    }
    if (
      buildSchemaOptions.disableUnique &&
      field.unique &&
      fieldShouldBeLocalized({ field, parentIsLocalized })
    ) {
      baseSchema.coordinates.sparse = true
    }

    schema.add({
      [field.name]: localizeSchema(
        field,
        baseSchema,
        payload.config.localization,
        parentIsLocalized,
      ),
    })

    if (field.index === true || field.index === undefined) {
      const indexOptions: IndexOptions = {}
      if (!buildSchemaOptions.disableUnique && field.unique) {
        indexOptions.sparse = true
        indexOptions.unique = true
      }
      if (fieldShouldBeLocalized({ field, parentIsLocalized }) && payload.config.localization) {
        payload.config.localization.locales.forEach((locale) => {
          schema.index({ [`${field.name}.${locale.code}`]: '2dsphere' }, indexOptions)
        })
      } else {
        schema.index({ [field.name]: '2dsphere' }, indexOptions)
      }
    }
  },
  radio: (field: RadioField, schema, payload, buildSchemaOptions, parentIsLocalized): void => {
    const baseSchema = {
      ...formatBaseSchema({ buildSchemaOptions, field, parentIsLocalized }),
      type: String,
      enum: field.options.map((option) => {
        if (typeof option === 'object') {
          return option.value
        }
        return option
      }),
    }

    schema.add({
      [field.name]: localizeSchema(
        field,
        baseSchema,
        payload.config.localization,
        parentIsLocalized,
      ),
    })
  },
  relationship: (
    field: RelationshipField,
    schema,
    payload,
    buildSchemaOptions,
    parentIsLocalized,
  ) => {
    const hasManyRelations = Array.isArray(field.relationTo)
    let schemaToReturn: { [key: string]: any } = {}

    const valueType = getRelationshipValueType(field, payload)

    if (fieldShouldBeLocalized({ field, parentIsLocalized }) && payload.config.localization) {
      schemaToReturn = {
        type: payload.config.localization.localeCodes.reduce((locales, locale) => {
          let localeSchema: { [key: string]: any } = {}

          if (hasManyRelations) {
            localeSchema = {
              ...formatBaseSchema({ buildSchemaOptions, field, parentIsLocalized }),
              _id: false,
              type: mongoose.Schema.Types.Mixed,
              relationTo: { type: String, enum: field.relationTo },
              value: {
                type: valueType,
                refPath: `${field.name}.${locale}.relationTo`,
              },
            }
          } else {
            localeSchema = {
              ...formatBaseSchema({ buildSchemaOptions, field, parentIsLocalized }),
              type: valueType,
              ref: field.relationTo,
            }
          }

          return {
            ...locales,
            [locale]: field.hasMany
              ? { type: [localeSchema], default: formatDefaultValue(field) }
              : localeSchema,
          }
        }, {}),
        localized: true,
      }
    } else if (hasManyRelations) {
      schemaToReturn = {
        ...formatBaseSchema({ buildSchemaOptions, field, parentIsLocalized }),
        _id: false,
        type: mongoose.Schema.Types.Mixed,
        relationTo: { type: String, enum: field.relationTo },
        value: {
          type: valueType,
          refPath: `${field.name}.relationTo`,
        },
      }

      if (field.hasMany) {
        schemaToReturn = {
          type: [schemaToReturn],
          default: formatDefaultValue(field),
        }
      }
    } else {
      schemaToReturn = {
        ...formatBaseSchema({ buildSchemaOptions, field, parentIsLocalized }),
        type: valueType,
        ref: field.relationTo,
      }

      if (field.hasMany) {
        schemaToReturn = {
          type: [schemaToReturn],
          default: formatDefaultValue(field),
        }
      }
    }

    schema.add({
      [field.name]: schemaToReturn,
    })
  },
  richText: (
    field: RichTextField,
    schema,
    payload,
    buildSchemaOptions,
    parentIsLocalized,
  ): void => {
    const baseSchema = {
      ...formatBaseSchema({ buildSchemaOptions, field, parentIsLocalized }),
      type: mongoose.Schema.Types.Mixed,
    }

    schema.add({
      [field.name]: localizeSchema(
        field,
        baseSchema,
        payload.config.localization,
        parentIsLocalized,
      ),
    })
  },
  row: (field: RowField, schema, payload, buildSchemaOptions, parentIsLocalized): void => {
    field.fields.forEach((subField: Field) => {
      if (fieldIsVirtual(subField)) {
        return
      }

      const addFieldSchema: FieldSchemaGenerator = fieldToSchemaMap[subField.type]

      if (addFieldSchema) {
        addFieldSchema(subField, schema, payload, buildSchemaOptions, parentIsLocalized)
      }
    })
  },
  select: (field: SelectField, schema, payload, buildSchemaOptions, parentIsLocalized): void => {
    const baseSchema = {
      ...formatBaseSchema({ buildSchemaOptions, field, parentIsLocalized }),
      type: String,
      enum: field.options.map((option) => {
        if (typeof option === 'object') {
          return option.value
        }
        return option
      }),
    }

    if (buildSchemaOptions.draftsEnabled || !field.required) {
      baseSchema.enum.push(null)
    }

    schema.add({
      [field.name]: localizeSchema(
        field,
        field.hasMany ? [baseSchema] : baseSchema,
        payload.config.localization,
        parentIsLocalized,
      ),
    })
  },
  tabs: (field: TabsField, schema, payload, buildSchemaOptions, parentIsLocalized): void => {
    field.tabs.forEach((tab) => {
      if (tabHasName(tab)) {
        if (fieldIsVirtual(tab)) {
          return
        }
        const baseSchema = {
          type: buildSchema({
            buildSchemaOptions: {
              disableUnique: buildSchemaOptions.disableUnique,
              draftsEnabled: buildSchemaOptions.draftsEnabled,
              options: {
                _id: false,
                id: false,
                minimize: false,
              },
            },
            configFields: tab.fields,
            parentIsLocalized: parentIsLocalized || tab.localized,
            payload,
          }),
        }

        schema.add({
          [tab.name]: localizeSchema(
            tab,
            baseSchema,
            payload.config.localization,
            parentIsLocalized,
          ),
        })
      } else {
        tab.fields.forEach((subField: Field) => {
          if (fieldIsVirtual(subField)) {
            return
          }
          const addFieldSchema: FieldSchemaGenerator = fieldToSchemaMap[subField.type]

          if (addFieldSchema) {
            addFieldSchema(
              subField,
              schema,
              payload,
              buildSchemaOptions,
              parentIsLocalized || tab.localized,
            )
          }
        })
      }
    })
  },
  text: (field: TextField, schema, payload, buildSchemaOptions, parentIsLocalized): void => {
    const baseSchema = {
      ...formatBaseSchema({ buildSchemaOptions, field, parentIsLocalized }),
      type: field.hasMany ? [String] : String,
    }

    schema.add({
      [field.name]: localizeSchema(
        field,
        baseSchema,
        payload.config.localization,
        parentIsLocalized,
      ),
    })
  },
  textarea: (
    field: TextareaField,
    schema,
    payload,
    buildSchemaOptions,
    parentIsLocalized,
  ): void => {
    const baseSchema = {
      ...formatBaseSchema({ buildSchemaOptions, field, parentIsLocalized }),
      type: String,
    }

    schema.add({
      [field.name]: localizeSchema(
        field,
        baseSchema,
        payload.config.localization,
        parentIsLocalized,
      ),
    })
  },
  upload: (field: UploadField, schema, payload, buildSchemaOptions, parentIsLocalized): void => {
    const hasManyRelations = Array.isArray(field.relationTo)
    let schemaToReturn: { [key: string]: any } = {}

    const valueType = getRelationshipValueType(field, payload)

    if (fieldShouldBeLocalized({ field, parentIsLocalized }) && payload.config.localization) {
      schemaToReturn = {
        type: payload.config.localization.localeCodes.reduce((locales, locale) => {
          let localeSchema: { [key: string]: any } = {}

          if (hasManyRelations) {
            localeSchema = {
              ...formatBaseSchema({ buildSchemaOptions, field, parentIsLocalized }),
              _id: false,
              type: mongoose.Schema.Types.Mixed,
              relationTo: { type: String, enum: field.relationTo },
              value: {
                type: valueType,
                refPath: `${field.name}.${locale}.relationTo`,
              },
            }
          } else {
            localeSchema = {
              ...formatBaseSchema({ buildSchemaOptions, field, parentIsLocalized }),
              type: valueType,
              ref: field.relationTo,
            }
          }

          return {
            ...locales,
            [locale]: field.hasMany
              ? { type: [localeSchema], default: formatDefaultValue(field) }
              : localeSchema,
          }
        }, {}),
        localized: true,
      }
    } else if (hasManyRelations) {
      schemaToReturn = {
        ...formatBaseSchema({ buildSchemaOptions, field, parentIsLocalized }),
        _id: false,
        type: mongoose.Schema.Types.Mixed,
        relationTo: { type: String, enum: field.relationTo },
        value: {
          type: valueType,
          refPath: `${field.name}.relationTo`,
        },
      }

      if (field.hasMany) {
        schemaToReturn = {
          type: [schemaToReturn],
          default: formatDefaultValue(field),
        }
      }
    } else {
      schemaToReturn = {
        ...formatBaseSchema({ buildSchemaOptions, field, parentIsLocalized }),
        type: valueType,
        ref: field.relationTo,
      }

      if (field.hasMany) {
        schemaToReturn = {
          type: [schemaToReturn],
          default: formatDefaultValue(field),
        }
      }
    }

    schema.add({
      [field.name]: schemaToReturn,
    })
  },
}

const getRelationshipValueType = (field: RelationshipField | UploadField, payload: Payload) => {
  if (typeof field.relationTo === 'string') {
    const { customIDType } = payload.collections[field.relationTo]

    if (!customIDType) {
      return mongoose.Schema.Types.ObjectId
    }

    if (customIDType === 'number') {
      return mongoose.Schema.Types.Number
    }

    return mongoose.Schema.Types.String
  }

  // has custom id relationTo
  if (
    field.relationTo.some((relationTo) => {
      return !!payload.collections[relationTo].customIDType
    })
  ) {
    return mongoose.Schema.Types.Mixed
  }

  return mongoose.Schema.Types.ObjectId
}
