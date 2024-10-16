import type { IndexOptions, Schema, SchemaOptions, SchemaTypeOptions } from 'mongoose'
import type {
  ArrayField,
  Block,
  BlocksField,
  CheckboxField,
  CodeField,
  CollapsibleField,
  DateField,
  EmailField,
  Field,
  FieldAffectingData,
  GroupField,
  JSONField,
  NonPresentationalField,
  NumberField,
  PointField,
  RadioField,
  RelationshipField,
  RichTextField,
  RowField,
  SanitizedConfig,
  SanitizedLocalizationConfig,
  SelectField,
  Tab,
  TabsField,
  TextareaField,
  TextField,
  UploadField,
} from 'payload'

import mongoose from 'mongoose'
import {
  fieldAffectsData,
  fieldIsLocalized,
  fieldIsPresentationalOnly,
  fieldIsVirtual,
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
  config: SanitizedConfig,
  buildSchemaOptions: BuildSchemaOptions,
) => void

/**
 * get a field's defaultValue only if defined and not dynamic so that it can be set on the field schema
 * @param field
 */
const formatDefaultValue = (field: FieldAffectingData) =>
  typeof field.defaultValue !== 'undefined' && typeof field.defaultValue !== 'function'
    ? field.defaultValue
    : undefined

const formatBaseSchema = (field: FieldAffectingData, buildSchemaOptions: BuildSchemaOptions) => {
  const { disableUnique, draftsEnabled, indexSortableFields } = buildSchemaOptions
  const schema: SchemaTypeOptions<unknown> = {
    default: formatDefaultValue(field),
    index: field.index || (!disableUnique && field.unique) || indexSortableFields || false,
    required: false,
    unique: (!disableUnique && field.unique) || false,
  }

  if (
    schema.unique &&
    (field.localized ||
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
) => {
  if (fieldIsLocalized(entity) && localization && Array.isArray(localization.locales)) {
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

export const buildSchema = (
  config: SanitizedConfig,
  configFields: Field[],
  buildSchemaOptions: BuildSchemaOptions = {},
): Schema => {
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
        addFieldSchema(field, schema, config, buildSchemaOptions)
      }
    }
  })

  return schema
}

const fieldToSchemaMap: Record<string, FieldSchemaGenerator> = {
  array: (
    field: ArrayField,
    schema: Schema,
    config: SanitizedConfig,
    buildSchemaOptions: BuildSchemaOptions,
  ) => {
    const baseSchema = {
      ...formatBaseSchema(field, buildSchemaOptions),
      type: [
        buildSchema(config, field.fields, {
          allowIDField: true,
          disableUnique: buildSchemaOptions.disableUnique,
          draftsEnabled: buildSchemaOptions.draftsEnabled,
          options: {
            _id: false,
            id: false,
            minimize: false,
          },
        }),
      ],
    }

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, config.localization),
    })
  },
  blocks: (
    field: BlocksField,
    schema: Schema,
    config: SanitizedConfig,
    buildSchemaOptions: BuildSchemaOptions,
  ): void => {
    const fieldSchema = {
      type: [new mongoose.Schema({}, { _id: false, discriminatorKey: 'blockType' })],
    }

    schema.add({
      [field.name]: localizeSchema(field, fieldSchema, config.localization),
    })

    field.blocks.forEach((blockItem: Block) => {
      const blockSchema = new mongoose.Schema({}, { _id: false, id: false })

      blockItem.fields.forEach((blockField) => {
        const addFieldSchema: FieldSchemaGenerator = fieldToSchemaMap[blockField.type]
        if (addFieldSchema) {
          addFieldSchema(blockField, blockSchema, config, buildSchemaOptions)
        }
      })

      if (field.localized && config.localization) {
        config.localization.localeCodes.forEach((localeCode) => {
          // @ts-expect-error Possible incorrect typing in mongoose types, this works
          schema.path(`${field.name}.${localeCode}`).discriminator(blockItem.slug, blockSchema)
        })
      } else {
        // @ts-expect-error Possible incorrect typing in mongoose types, this works
        schema.path(field.name).discriminator(blockItem.slug, blockSchema)
      }
    })
  },
  checkbox: (
    field: CheckboxField,
    schema: Schema,
    config: SanitizedConfig,
    buildSchemaOptions: BuildSchemaOptions,
  ): void => {
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: Boolean }

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, config.localization),
    })
  },
  code: (
    field: CodeField,
    schema: Schema,
    config: SanitizedConfig,
    buildSchemaOptions: BuildSchemaOptions,
  ): void => {
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: String }

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, config.localization),
    })
  },
  collapsible: (
    field: CollapsibleField,
    schema: Schema,
    config: SanitizedConfig,
    buildSchemaOptions: BuildSchemaOptions,
  ): void => {
    field.fields.forEach((subField: Field) => {
      if (fieldIsVirtual(subField)) {
        return
      }

      const addFieldSchema: FieldSchemaGenerator = fieldToSchemaMap[subField.type]

      if (addFieldSchema) {
        addFieldSchema(subField, schema, config, buildSchemaOptions)
      }
    })
  },
  date: (
    field: DateField,
    schema: Schema,
    config: SanitizedConfig,
    buildSchemaOptions: BuildSchemaOptions,
  ): void => {
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: Date }

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, config.localization),
    })
  },
  email: (
    field: EmailField,
    schema: Schema,
    config: SanitizedConfig,
    buildSchemaOptions: BuildSchemaOptions,
  ): void => {
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: String }

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, config.localization),
    })
  },
  group: (
    field: GroupField,
    schema: Schema,
    config: SanitizedConfig,
    buildSchemaOptions: BuildSchemaOptions,
  ): void => {
    const formattedBaseSchema = formatBaseSchema(field, buildSchemaOptions)

    // carry indexSortableFields through to versions if drafts enabled
    const indexSortableFields =
      buildSchemaOptions.indexSortableFields &&
      field.name === 'version' &&
      buildSchemaOptions.draftsEnabled

    const baseSchema = {
      ...formattedBaseSchema,
      type: buildSchema(config, field.fields, {
        disableUnique: buildSchemaOptions.disableUnique,
        draftsEnabled: buildSchemaOptions.draftsEnabled,
        indexSortableFields,
        options: {
          _id: false,
          id: false,
          minimize: false,
        },
      }),
    }

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, config.localization),
    })
  },
  json: (
    field: JSONField,
    schema: Schema,
    config: SanitizedConfig,
    buildSchemaOptions: BuildSchemaOptions,
  ): void => {
    const baseSchema = {
      ...formatBaseSchema(field, buildSchemaOptions),
      type: mongoose.Schema.Types.Mixed,
    }

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, config.localization),
    })
  },
  number: (
    field: NumberField,
    schema: Schema,
    config: SanitizedConfig,
    buildSchemaOptions: BuildSchemaOptions,
  ): void => {
    const baseSchema = {
      ...formatBaseSchema(field, buildSchemaOptions),
      type: field.hasMany ? [Number] : Number,
    }

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, config.localization),
    })
  },
  point: (
    field: PointField,
    schema: Schema,
    config: SanitizedConfig,
    buildSchemaOptions: BuildSchemaOptions,
  ): void => {
    const baseSchema: SchemaTypeOptions<unknown> = {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
        default: formatDefaultValue(field),
        required: false,
      },
    }
    if (buildSchemaOptions.disableUnique && field.unique && field.localized) {
      baseSchema.coordinates.sparse = true
    }

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, config.localization),
    })

    if (field.index === true || field.index === undefined) {
      const indexOptions: IndexOptions = {}
      if (!buildSchemaOptions.disableUnique && field.unique) {
        indexOptions.sparse = true
        indexOptions.unique = true
      }
      if (field.localized && config.localization) {
        config.localization.locales.forEach((locale) => {
          schema.index({ [`${field.name}.${locale.code}`]: '2dsphere' }, indexOptions)
        })
      } else {
        schema.index({ [field.name]: '2dsphere' }, indexOptions)
      }
    }
  },
  radio: (
    field: RadioField,
    schema: Schema,
    config: SanitizedConfig,
    buildSchemaOptions: BuildSchemaOptions,
  ): void => {
    const baseSchema = {
      ...formatBaseSchema(field, buildSchemaOptions),
      type: String,
      enum: field.options.map((option) => {
        if (typeof option === 'object') {
          return option.value
        }
        return option
      }),
    }

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, config.localization),
    })
  },
  relationship: (
    field: RelationshipField,
    schema: Schema,
    config: SanitizedConfig,
    buildSchemaOptions: BuildSchemaOptions,
  ) => {
    const hasManyRelations = Array.isArray(field.relationTo)
    let schemaToReturn: { [key: string]: any } = {}

    if (field.localized && config.localization) {
      schemaToReturn = {
        type: config.localization.localeCodes.reduce((locales, locale) => {
          let localeSchema: { [key: string]: any } = {}

          if (hasManyRelations) {
            localeSchema = {
              ...formatBaseSchema(field, buildSchemaOptions),
              _id: false,
              type: mongoose.Schema.Types.Mixed,
              relationTo: { type: String, enum: field.relationTo },
              value: {
                type: mongoose.Schema.Types.Mixed,
                refPath: `${field.name}.${locale}.relationTo`,
              },
            }
          } else {
            localeSchema = {
              ...formatBaseSchema(field, buildSchemaOptions),
              type: mongoose.Schema.Types.Mixed,
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
        ...formatBaseSchema(field, buildSchemaOptions),
        _id: false,
        type: mongoose.Schema.Types.Mixed,
        relationTo: { type: String, enum: field.relationTo },
        value: {
          type: mongoose.Schema.Types.Mixed,
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
        ...formatBaseSchema(field, buildSchemaOptions),
        type: mongoose.Schema.Types.Mixed,
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
    schema: Schema,
    config: SanitizedConfig,
    buildSchemaOptions: BuildSchemaOptions,
  ): void => {
    const baseSchema = {
      ...formatBaseSchema(field, buildSchemaOptions),
      type: mongoose.Schema.Types.Mixed,
    }

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, config.localization),
    })
  },
  row: (
    field: RowField,
    schema: Schema,
    config: SanitizedConfig,
    buildSchemaOptions: BuildSchemaOptions,
  ): void => {
    field.fields.forEach((subField: Field) => {
      if (fieldIsVirtual(subField)) {
        return
      }

      const addFieldSchema: FieldSchemaGenerator = fieldToSchemaMap[subField.type]

      if (addFieldSchema) {
        addFieldSchema(subField, schema, config, buildSchemaOptions)
      }
    })
  },
  select: (
    field: SelectField,
    schema: Schema,
    config: SanitizedConfig,
    buildSchemaOptions: BuildSchemaOptions,
  ): void => {
    const baseSchema = {
      ...formatBaseSchema(field, buildSchemaOptions),
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
        config.localization,
      ),
    })
  },
  tabs: (
    field: TabsField,
    schema: Schema,
    config: SanitizedConfig,
    buildSchemaOptions: BuildSchemaOptions,
  ): void => {
    field.tabs.forEach((tab) => {
      if (tabHasName(tab)) {
        if (fieldIsVirtual(tab)) {
          return
        }
        const baseSchema = {
          type: buildSchema(config, tab.fields, {
            disableUnique: buildSchemaOptions.disableUnique,
            draftsEnabled: buildSchemaOptions.draftsEnabled,
            options: {
              _id: false,
              id: false,
              minimize: false,
            },
          }),
        }

        schema.add({
          [tab.name]: localizeSchema(tab, baseSchema, config.localization),
        })
      } else {
        tab.fields.forEach((subField: Field) => {
          if (fieldIsVirtual(subField)) {
            return
          }
          const addFieldSchema: FieldSchemaGenerator = fieldToSchemaMap[subField.type]

          if (addFieldSchema) {
            addFieldSchema(subField, schema, config, buildSchemaOptions)
          }
        })
      }
    })
  },
  text: (
    field: TextField,
    schema: Schema,
    config: SanitizedConfig,
    buildSchemaOptions: BuildSchemaOptions,
  ): void => {
    const baseSchema = {
      ...formatBaseSchema(field, buildSchemaOptions),
      type: field.hasMany ? [String] : String,
    }

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, config.localization),
    })
  },
  textarea: (
    field: TextareaField,
    schema: Schema,
    config: SanitizedConfig,
    buildSchemaOptions: BuildSchemaOptions,
  ): void => {
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: String }

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, config.localization),
    })
  },
  upload: (
    field: UploadField,
    schema: Schema,
    config: SanitizedConfig,
    buildSchemaOptions: BuildSchemaOptions,
  ): void => {
    const hasManyRelations = Array.isArray(field.relationTo)
    let schemaToReturn: { [key: string]: any } = {}

    if (field.localized && config.localization) {
      schemaToReturn = {
        type: config.localization.localeCodes.reduce((locales, locale) => {
          let localeSchema: { [key: string]: any } = {}

          if (hasManyRelations) {
            localeSchema = {
              ...formatBaseSchema(field, buildSchemaOptions),
              _id: false,
              type: mongoose.Schema.Types.Mixed,
              relationTo: { type: String, enum: field.relationTo },
              value: {
                type: mongoose.Schema.Types.Mixed,
                refPath: `${field.name}.${locale}.relationTo`,
              },
            }
          } else {
            localeSchema = {
              ...formatBaseSchema(field, buildSchemaOptions),
              type: mongoose.Schema.Types.Mixed,
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
        ...formatBaseSchema(field, buildSchemaOptions),
        _id: false,
        type: mongoose.Schema.Types.Mixed,
        relationTo: { type: String, enum: field.relationTo },
        value: {
          type: mongoose.Schema.Types.Mixed,
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
        ...formatBaseSchema(field, buildSchemaOptions),
        type: mongoose.Schema.Types.Mixed,
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
