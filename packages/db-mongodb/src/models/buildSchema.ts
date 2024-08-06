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
  SelectField,
  Tab,
  TabsField,
  TextField,
  TextareaField,
  UploadField,
} from 'payload/types'

import { Schema } from 'mongoose'
import {
  fieldAffectsData,
  fieldIsLocalized,
  fieldIsPresentationalOnly,
  tabHasName,
} from 'payload/types'

import type { MongooseAdapter } from '..'

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
  adapter: MongooseAdapter,
  buildSchemaOptions: BuildSchemaOptions,
) => void

const idTypes = {
  string: String,
  number: Number,
  objectid: Schema.Types.ObjectId,
}

const formatBaseSchema = (field: FieldAffectingData, buildSchemaOptions: BuildSchemaOptions) => {
  const { disableUnique, draftsEnabled, indexSortableFields } = buildSchemaOptions
  const schema: SchemaTypeOptions<unknown> = {
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
  localization: SanitizedLocalizationConfig | false,
) => {
  if (fieldIsLocalized(entity) && localization && Array.isArray(localization.locales)) {
    return {
      type: localization.localeCodes.reduce(
        (localeSchema, locale) => {
          localeSchema[locale] = schema
          return localeSchema
        },
        {
          _id: false,
        },
      ),
      localized: true,
    }
  }
  return schema
}

const buildSchema = (
  adapter: MongooseAdapter,
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
        addFieldSchema(field, schema, adapter, buildSchemaOptions)
      }
    }
  })

  return schema
}

const fieldToSchemaMap: Record<string, FieldSchemaGenerator> = {
  array: (
    field: ArrayField,
    schema: Schema,
    adapter: MongooseAdapter,
    buildSchemaOptions: BuildSchemaOptions,
  ) => {
    const baseSchema = {
      ...formatBaseSchema(field, buildSchemaOptions),
      type: [
        buildSchema(adapter, field.fields, {
          allowIDField: true,
          disableUnique: buildSchemaOptions.disableUnique,
          draftsEnabled: buildSchemaOptions.draftsEnabled,
          options: {
            minimize: false,
            ...(buildSchemaOptions.options || {}),
            _id: false,
            id: false,
            timestamps: false,
          },
        }),
      ],
      default: undefined,
    }

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, adapter.payload.config.localization),
    })
  },
  blocks: (
    field: BlockField,
    schema: Schema,
    adapter: MongooseAdapter,
    buildSchemaOptions: BuildSchemaOptions,
  ): void => {
    const fieldSchema = {
      type: [
        new Schema(
          {},
          {
            _id: false,
            discriminatorKey: 'blockType',
            ...(buildSchemaOptions.options || {}),
            timestamps: false,
          },
        ),
      ],
      default: undefined,
    }

    schema.add({
      [field.name]: localizeSchema(field, fieldSchema, adapter.payload.config.localization),
    })

    field.blocks.forEach((blockItem: Block) => {
      const blockSchema = new Schema(
        {},
        {
          ...(buildSchemaOptions.options || {}),
          _id: false,
          id: false,
          timestamps: false,
        },
      )

      blockItem.fields.forEach((blockField) => {
        const addFieldSchema: FieldSchemaGenerator = fieldToSchemaMap[blockField.type]
        if (addFieldSchema) {
          addFieldSchema(blockField, blockSchema, adapter, buildSchemaOptions)
        }
      })

      if (field.localized && adapter.payload.config.localization) {
        adapter.payload.config.localization.localeCodes.forEach((localeCode) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error Possible incorrect typing in mongoose types, this works
          schema.path(`${field.name}.${localeCode}`).discriminator(blockItem.slug, blockSchema)
        })
      } else {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error Possible incorrect typing in mongoose types, this works
        schema.path(field.name).discriminator(blockItem.slug, blockSchema)
      }
    })
  },
  checkbox: (
    field: CheckboxField,
    schema: Schema,
    adapter: MongooseAdapter,
    buildSchemaOptions: BuildSchemaOptions,
  ): void => {
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: Boolean }

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, adapter.payload.config.localization),
    })
  },
  code: (
    field: CodeField,
    schema: Schema,
    adapter: MongooseAdapter,
    buildSchemaOptions: BuildSchemaOptions,
  ): void => {
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: String }

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, adapter.payload.config.localization),
    })
  },
  collapsible: (
    field: CollapsibleField,
    schema: Schema,
    adapter: MongooseAdapter,
    buildSchemaOptions: BuildSchemaOptions,
  ): void => {
    field.fields.forEach((subField: Field) => {
      const addFieldSchema: FieldSchemaGenerator = fieldToSchemaMap[subField.type]

      if (addFieldSchema) {
        addFieldSchema(subField, schema, adapter, buildSchemaOptions)
      }
    })
  },
  date: (
    field: DateField,
    schema: Schema,
    adapter: MongooseAdapter,
    buildSchemaOptions: BuildSchemaOptions,
  ): void => {
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: Date }

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, adapter.payload.config.localization),
    })
  },
  email: (
    field: EmailField,
    schema: Schema,
    adapter: MongooseAdapter,
    buildSchemaOptions: BuildSchemaOptions,
  ): void => {
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: String }

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, adapter.payload.config.localization),
    })
  },
  group: (
    field: GroupField,
    schema: Schema,
    adapter: MongooseAdapter,
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
      type: buildSchema(adapter, field.fields, {
        disableUnique: buildSchemaOptions.disableUnique,
        draftsEnabled: buildSchemaOptions.draftsEnabled,
        indexSortableFields,
        options: {
          minimize: false,
          ...(buildSchemaOptions.options || {}),
          _id: false,
          id: false,
          timestamps: false,
        },
      }),
    }

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, adapter.payload.config.localization),
    })
  },
  json: (
    field: JSONField,
    schema: Schema,
    adapter: MongooseAdapter,
    buildSchemaOptions: BuildSchemaOptions,
  ): void => {
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: Schema.Types.Mixed }

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, adapter.payload.config.localization),
    })
  },
  number: (
    field: NumberField,
    schema: Schema,
    adapter: MongooseAdapter,
    buildSchemaOptions: BuildSchemaOptions,
  ): void => {
    const baseSchema = {
      ...formatBaseSchema(field, buildSchemaOptions),
      type: field.hasMany ? [Number] : Number,
    }

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, adapter.payload.config.localization),
    })
  },
  point: (
    field: PointField,
    schema: Schema,
    adapter: MongooseAdapter,
    buildSchemaOptions: BuildSchemaOptions,
  ): void => {
    const baseSchema: SchemaTypeOptions<unknown> = {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
        default: field.defaultValue || undefined,
        required: false,
      },
    }
    if (buildSchemaOptions.disableUnique && field.unique && field.localized) {
      baseSchema.coordinates.sparse = true
    }

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, adapter.payload.config.localization),
    })

    if (field.index === true || field.index === undefined) {
      const indexOptions: IndexOptions = {}
      if (!buildSchemaOptions.disableUnique && field.unique) {
        indexOptions.sparse = true
        indexOptions.unique = true
      }
      if (field.localized && adapter.payload.config.localization) {
        adapter.payload.config.localization.locales.forEach((locale) => {
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
    adapter: MongooseAdapter,
    buildSchemaOptions: BuildSchemaOptions,
  ): void => {
    const baseSchema = {
      ...formatBaseSchema(field, buildSchemaOptions),
      type: String,
      enum: field.options.map((option) => {
        if (typeof option === 'object') return option.value
        return option
      }),
    }

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, adapter.payload.config.localization),
    })
  },
  relationship: (
    field: RelationshipField,
    schema: Schema,
    adapter: MongooseAdapter,
    buildSchemaOptions: BuildSchemaOptions,
  ) => {
    const hasManyRelations = Array.isArray(field.relationTo)
    let schemaToReturn: { [key: string]: any } = {}

    if (field.localized && adapter.payload.config.localization) {
      schemaToReturn = {
        type: adapter.payload.config.localization.localeCodes.reduce((locales, locale) => {
          let localeSchema: { [key: string]: any } = {}

          if (hasManyRelations) {
            localeSchema = {
              ...formatBaseSchema(field, buildSchemaOptions),
              _id: false,
              type: idTypes[field.idType] || Schema.Types.Mixed,
              relationTo: { type: String, enum: field.relationTo },
              value: {
                type: idTypes[field.idType] || Schema.Types.Mixed,
                refPath: `${field.name}.${locale}.relationTo`,
              },
            }
          } else {
            localeSchema = {
              ...formatBaseSchema(field, buildSchemaOptions),
              type: idTypes[field.idType] || Schema.Types.Mixed,
              ref: field.relationTo,
            }
          }

          return {
            ...locales,
            [locale]: field.hasMany ? { type: [localeSchema], default: undefined } : localeSchema,
          }
        }, {}),
        localized: true,
      }
    } else if (hasManyRelations) {
      schemaToReturn = {
        ...formatBaseSchema(field, buildSchemaOptions),
        _id: false,
        type: idTypes[field.idType] || Schema.Types.Mixed,
        relationTo: { type: String, enum: field.relationTo },
        value: {
          type: idTypes[field.idType] || Schema.Types.Mixed,
          refPath: `${field.name}.relationTo`,
        },
      }

      if (field.hasMany) {
        schemaToReturn = {
          type: [schemaToReturn],
          default: undefined,
        }
      }
    } else {
      schemaToReturn = {
        ...formatBaseSchema(field, buildSchemaOptions),
        type: idTypes[field.idType] || Schema.Types.Mixed,
        ref: field.relationTo,
      }

      if (field.hasMany) {
        schemaToReturn = {
          type: [schemaToReturn],
          default: undefined,
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
    adapter: MongooseAdapter,
    buildSchemaOptions: BuildSchemaOptions,
  ): void => {
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: Schema.Types.Mixed }

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, adapter.payload.config.localization),
    })
  },
  row: (
    field: RowField,
    schema: Schema,
    adapter: MongooseAdapter,
    buildSchemaOptions: BuildSchemaOptions,
  ): void => {
    field.fields.forEach((subField: Field) => {
      const addFieldSchema: FieldSchemaGenerator = fieldToSchemaMap[subField.type]

      if (addFieldSchema) {
        addFieldSchema(subField, schema, adapter, buildSchemaOptions)
      }
    })
  },
  select: (
    field: SelectField,
    schema: Schema,
    adapter: MongooseAdapter,
    buildSchemaOptions: BuildSchemaOptions,
  ): void => {
    const baseSchema = {
      ...formatBaseSchema(field, buildSchemaOptions),
      type: String,
      enum: field.options.map((option) => {
        if (typeof option === 'object') return option.value
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
        adapter.payload.config.localization,
      ),
    })
  },
  tabs: (
    field: TabsField,
    schema: Schema,
    adapter: MongooseAdapter,
    buildSchemaOptions: BuildSchemaOptions,
  ): void => {
    field.tabs.forEach((tab) => {
      if (tabHasName(tab)) {
        const baseSchema = {
          type: buildSchema(adapter, tab.fields, {
            disableUnique: buildSchemaOptions.disableUnique,
            draftsEnabled: buildSchemaOptions.draftsEnabled,
            options: {
              minimize: false,
              ...(buildSchemaOptions.options || {}),
              _id: false,
              id: false,
              timestamps: false,
            },
          }),
        }

        schema.add({
          [tab.name]: localizeSchema(tab, baseSchema, adapter.payload.config.localization),
        })
      } else {
        tab.fields.forEach((subField: Field) => {
          const addFieldSchema: FieldSchemaGenerator = fieldToSchemaMap[subField.type]

          if (addFieldSchema) {
            addFieldSchema(subField, schema, adapter, buildSchemaOptions)
          }
        })
      }
    })
  },
  text: (
    field: TextField,
    schema: Schema,
    adapter: MongooseAdapter,
    buildSchemaOptions: BuildSchemaOptions,
  ): void => {
    const baseSchema = {
      ...formatBaseSchema(field, buildSchemaOptions),
      type: field.hasMany ? [String] : String,
    }

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, adapter.payload.config.localization),
    })
  },
  textarea: (
    field: TextareaField,
    schema: Schema,
    adapter: MongooseAdapter,
    buildSchemaOptions: BuildSchemaOptions,
  ): void => {
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: String }

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, adapter.payload.config.localization),
    })
  },
  upload: (
    field: UploadField,
    schema: Schema,
    adapter: MongooseAdapter,
    buildSchemaOptions: BuildSchemaOptions,
  ): void => {
    const baseSchema = {
      ...formatBaseSchema(field, buildSchemaOptions),
      type: Schema.Types.Mixed,
      ref: field.relationTo,
    }

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, adapter.payload.config.localization),
    })
  },
}

export default buildSchema
