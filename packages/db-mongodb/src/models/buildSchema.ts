/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-use-before-define */
import type { IndexOptions, SchemaOptions, SchemaTypeOptions } from 'mongoose'
import type { SanitizedConfig, SanitizedLocalizationConfig } from 'payload/config'
import type {
  ArrayField,
  Block,
  BlockField,
  CheckboxField,
  CodeField,
  CollapsibleField,
  DateField,
  EmailField,
  Field,
  GroupField,
  JSONField,
  NumberField,
  PointField,
  RadioField,
  RelationshipField,
  RichTextField,
  RowField,
  SelectField,
  TabsField,
  TextField,
  TextareaField,
  UploadField,
} from 'payload/types'
import type { FieldAffectingData, NonPresentationalField, Tab } from 'payload/types'

import { Schema } from 'mongoose'
import {
  fieldAffectsData,
  fieldIsLocalized,
  fieldIsPresentationalOnly,
  tabHasName,
} from 'payload/types'

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

const formatBaseSchema = (field: FieldAffectingData, buildSchemaOptions: BuildSchemaOptions) => {
  const { disableUnique, draftsEnabled, indexSortableFields } = buildSchemaOptions
  const schema: SchemaTypeOptions<unknown> = {
    index: field.index || (!disableUnique && field.unique) || indexSortableFields || false,
    required: false,
    unique: (!disableUnique && field.unique) || false,
  }

  if (schema.unique && (field.localized || draftsEnabled)) {
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
  localization: SanitizedLocalizationConfig | false,
) => {
  if (fieldIsLocalized(entity) && localization && Array.isArray(localization.locales)) {
    return {
      localized: true,
      type: localization.localeCodes.reduce(
        (localeSchema, locale) => ({
          ...localeSchema,
          [locale]: schema,
        }),
        {
          _id: false,
        },
      ),
    }
  }
  return schema
}

const buildSchema = (
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

  const schema = new Schema(fields, options)

  schemaFields.forEach((field) => {
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
      default: undefined,
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
    field: BlockField,
    schema: Schema,
    config: SanitizedConfig,
    buildSchemaOptions: BuildSchemaOptions,
  ): void => {
    const fieldSchema = {
      default: undefined,
      type: [new Schema({}, { _id: false, discriminatorKey: 'blockType' })],
    }

    schema.add({
      [field.name]: localizeSchema(field, fieldSchema, config.localization),
    })

    field.blocks.forEach((blockItem: Block) => {
      const blockSchema = new Schema({}, { _id: false, id: false })

      blockItem.fields.forEach((blockField) => {
        const addFieldSchema: FieldSchemaGenerator = fieldToSchemaMap[blockField.type]
        if (addFieldSchema) {
          addFieldSchema(blockField, blockSchema, config, buildSchemaOptions)
        }
      })

      if (field.localized && config.localization) {
        config.localization.localeCodes.forEach((localeCode) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore Possible incorrect typing in mongoose types, this works
          schema.path(`${field.name}.${localeCode}`).discriminator(blockItem.slug, blockSchema)
        })
      } else {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore Possible incorrect typing in mongoose types, this works
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
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: Schema.Types.Mixed }

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
      coordinates: {
        default: field.defaultValue || undefined,
        required: false,
        type: [Number],
      },
      type: {
        enum: ['Point'],
        type: String,
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
          schema.index({ [`${field.name}.${locale}`]: '2dsphere' }, indexOptions)
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
      enum: field.options.map((option) => {
        if (typeof option === 'object') return option.value
        return option
      }),
      type: String,
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
        localized: true,
        type: config.localization.localeCodes.reduce((locales, locale) => {
          let localeSchema: { [key: string]: any } = {}

          if (hasManyRelations) {
            localeSchema = {
              ...formatBaseSchema(field, buildSchemaOptions),
              _id: false,
              relationTo: { enum: field.relationTo, type: String },
              type: Schema.Types.Mixed,
              value: {
                refPath: `${field.name}.${locale}.relationTo`,
                type: Schema.Types.Mixed,
              },
            }
          } else {
            localeSchema = {
              ...formatBaseSchema(field, buildSchemaOptions),
              ref: field.relationTo,
              type: Schema.Types.Mixed,
            }
          }

          return {
            ...locales,
            [locale]: field.hasMany ? { default: undefined, type: [localeSchema] } : localeSchema,
          }
        }, {}),
      }
    } else if (hasManyRelations) {
      schemaToReturn = {
        ...formatBaseSchema(field, buildSchemaOptions),
        _id: false,
        relationTo: { enum: field.relationTo, type: String },
        type: Schema.Types.Mixed,
        value: {
          refPath: `${field.name}.relationTo`,
          type: Schema.Types.Mixed,
        },
      }

      if (field.hasMany) {
        schemaToReturn = {
          default: undefined,
          type: [schemaToReturn],
        }
      }
    } else {
      schemaToReturn = {
        ...formatBaseSchema(field, buildSchemaOptions),
        ref: field.relationTo,
        type: Schema.Types.Mixed,
      }

      if (field.hasMany) {
        schemaToReturn = {
          default: undefined,
          type: [schemaToReturn],
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
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: Schema.Types.Mixed }

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
      enum: field.options.map((option) => {
        if (typeof option === 'object') return option.value
        return option
      }),
      type: String,
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
    const baseSchema = {
      ...formatBaseSchema(field, buildSchemaOptions),
      ref: field.relationTo,
      type: Schema.Types.Mixed,
    }

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, config.localization),
    })
  },
}

export default buildSchema
