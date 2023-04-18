/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-use-before-define */
import { IndexOptions, Schema, SchemaOptions, SchemaTypeOptions } from 'mongoose';
import { SanitizedConfig } from '../config/types';
import {
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
  fieldAffectsData, fieldIsLocalized,
  fieldIsPresentationalOnly,
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
  tabHasName,
  TabsField,
  TextareaField,
  TextField, UnnamedTab,
  UploadField,
} from '../fields/config/types';

export type BuildSchemaOptions = {
  options?: SchemaOptions
  allowIDField?: boolean
  disableUnique?: boolean
  draftsEnabled?: boolean
  indexSortableFields?: boolean
}

type FieldSchemaGenerator = (field: Field, schema: Schema, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions) => void;

const formatBaseSchema = (field: FieldAffectingData, buildSchemaOptions: BuildSchemaOptions) => {
  const { disableUnique, draftsEnabled, indexSortableFields } = buildSchemaOptions;
  const schema: SchemaTypeOptions<unknown> = {
    unique: (!disableUnique && field.unique) || false,
    required: false,
    index: field.index || (!disableUnique && field.unique) || indexSortableFields || false,
  };

  if ((schema.unique && (field.localized || draftsEnabled))) {
    schema.sparse = true;
  }

  if (field.hidden) {
    schema.hidden = true;
  }

  return schema;
};

const localizeSchema = (entity: NonPresentationalField | Tab, schema, localization) => {
  if (fieldIsLocalized(entity) && localization && Array.isArray(localization.locales)) {
    return {
      type: localization.locales.reduce((localeSchema, locale) => ({
        ...localeSchema,
        [locale]: schema,
      }), {
        _id: false,
      }),
      localized: true,
    };
  }
  return schema;
};

const buildSchema = (config: SanitizedConfig, configFields: Field[], buildSchemaOptions: BuildSchemaOptions = {}): Schema => {
  const { allowIDField, options } = buildSchemaOptions;
  let fields = {};

  let schemaFields = configFields;

  if (!allowIDField) {
    const idField = schemaFields.find((field) => fieldAffectsData(field) && field.name === 'id');
    if (idField) {
      fields = {
        _id: idField.type === 'number' ? Number : String,
      };
      schemaFields = schemaFields.filter((field) => !(fieldAffectsData(field) && field.name === 'id'));
    }
  }

  const schema = new Schema(fields, options);

  schemaFields.forEach((field) => {
    if (!fieldIsPresentationalOnly(field)) {
      const addFieldSchema: FieldSchemaGenerator = fieldToSchemaMap[field.type];

      if (addFieldSchema) {
        addFieldSchema(field, schema, config, buildSchemaOptions);
      }
    }
  });

  return schema;
};

const fieldToSchemaMap: Record<string, FieldSchemaGenerator> = {
  number: (field: NumberField, schema: Schema, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions): void => {
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: Number };

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, config.localization),
    });
  },
  text: (field: TextField, schema: Schema, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions): void => {
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: String };

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, config.localization),
    });
  },
  email: (field: EmailField, schema: Schema, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions): void => {
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: String };

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, config.localization),
    });
  },
  textarea: (field: TextareaField, schema: Schema, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions): void => {
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: String };

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, config.localization),
    });
  },
  richText: (field: RichTextField, schema: Schema, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions): void => {
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: Schema.Types.Mixed };

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, config.localization),
    });
  },
  code: (field: CodeField, schema: Schema, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions): void => {
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: String };

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, config.localization),
    });
  },
  json: (field: JSONField, schema: Schema, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions): void => {
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: Schema.Types.Mixed };

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, config.localization),
    });
  },
  point: (field: PointField, schema: Schema, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions): void => {
    const baseSchema: SchemaTypeOptions<unknown> = {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
        required: false,
        default: field.defaultValue || undefined,
      },
    };
    if (buildSchemaOptions.disableUnique && field.unique && field.localized) {
      baseSchema.coordinates.sparse = true;
    }

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, config.localization),
    });

    if (field.index === true || field.index === undefined) {
      const indexOptions: IndexOptions = {};
      if (!buildSchemaOptions.disableUnique && field.unique) {
        indexOptions.sparse = true;
        indexOptions.unique = true;
      }
      if (field.localized && config.localization) {
        config.localization.locales.forEach((locale) => {
          schema.index({ [`${field.name}.${locale}`]: '2dsphere' }, indexOptions);
        });
      } else {
        schema.index({ [field.name]: '2dsphere' }, indexOptions);
      }
    }
  },
  radio: (field: RadioField, schema: Schema, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions): void => {
    const baseSchema = {
      ...formatBaseSchema(field, buildSchemaOptions),
      type: String,
      enum: field.options.map((option) => {
        if (typeof option === 'object') return option.value;
        return option;
      }),
    };

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, config.localization),
    });
  },
  checkbox: (field: CheckboxField, schema: Schema, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions): void => {
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: Boolean };

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, config.localization),
    });
  },
  date: (field: DateField, schema: Schema, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions): void => {
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: Date };

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, config.localization),
    });
  },
  upload: (field: UploadField, schema: Schema, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions): void => {
    const baseSchema = {
      ...formatBaseSchema(field, buildSchemaOptions),
      type: Schema.Types.Mixed,
      ref: field.relationTo,
    };

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, config.localization),
    });
  },
  relationship: (field: RelationshipField, schema: Schema, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions) => {
    const hasManyRelations = Array.isArray(field.relationTo);
    let schemaToReturn: { [key: string]: any } = {};

    if (field.localized && config.localization) {
      schemaToReturn = {
        type: config.localization.locales.reduce((locales, locale) => {
          let localeSchema: { [key: string]: any } = {};

          if (hasManyRelations) {
            localeSchema = {
              ...formatBaseSchema(field, buildSchemaOptions),
              type: Schema.Types.Mixed,
              _id: false,
              value: {
                type: Schema.Types.Mixed,
                refPath: `${field.name}.${locale}.relationTo`,
              },
              relationTo: { type: String, enum: field.relationTo },
            };
          } else {
            localeSchema = {
              ...formatBaseSchema(field, buildSchemaOptions),
              type: Schema.Types.Mixed,
              ref: field.relationTo,
            };
          }

          return {
            ...locales,
            [locale]: field.hasMany ? { type: [localeSchema], default: undefined } : localeSchema,
          };
        }, {}),
        localized: true,
      };
    } else if (hasManyRelations) {
      schemaToReturn = {
        ...formatBaseSchema(field, buildSchemaOptions),
        type: Schema.Types.Mixed,
        _id: false,
        value: {
          type: Schema.Types.Mixed,
          refPath: `${field.name}.relationTo`,
        },
        relationTo: { type: String, enum: field.relationTo },
      };

      if (field.hasMany) {
        schemaToReturn = {
          type: [schemaToReturn],
          default: undefined,
        };
      }
    } else {
      schemaToReturn = {
        ...formatBaseSchema(field, buildSchemaOptions),
        type: Schema.Types.Mixed,
        ref: field.relationTo,
      };

      if (field.hasMany) {
        schemaToReturn = {
          type: [schemaToReturn],
          default: undefined,
        };
      }
    }

    schema.add({
      [field.name]: schemaToReturn,
    });
  },
  row: (field: RowField, schema: Schema, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions): void => {
    field.fields.forEach((subField: Field) => {
      const addFieldSchema: FieldSchemaGenerator = fieldToSchemaMap[subField.type];

      if (addFieldSchema) {
        addFieldSchema(subField, schema, config, buildSchemaOptions);
      }
    });
  },
  collapsible: (field: CollapsibleField, schema: Schema, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions): void => {
    field.fields.forEach((subField: Field) => {
      const addFieldSchema: FieldSchemaGenerator = fieldToSchemaMap[subField.type];

      if (addFieldSchema) {
        addFieldSchema(subField, schema, config, buildSchemaOptions);
      }
    });
  },
  tabs: (field: TabsField, schema: Schema, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions): void => {
    field.tabs.forEach((tab) => {
      if (tabHasName(tab)) {
        const baseSchema = {
          type: buildSchema(
            config,
            tab.fields,
            {
              options: {
                _id: false,
                id: false,
                minimize: false,
              },
              disableUnique: buildSchemaOptions.disableUnique,
              draftsEnabled: buildSchemaOptions.draftsEnabled,
            },
          ),
        };

        schema.add({
          [tab.name]: localizeSchema(tab, baseSchema, config.localization),
        });
      } else {
        (tab as UnnamedTab).fields.forEach((subField: Field) => {
          const addFieldSchema: FieldSchemaGenerator = fieldToSchemaMap[subField.type];

          if (addFieldSchema) {
            addFieldSchema(subField, schema, config, buildSchemaOptions);
          }
        });
      }
    });
  },
  array: (field: ArrayField, schema: Schema, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions) => {
    const baseSchema = {
      ...formatBaseSchema(field, buildSchemaOptions),
      default: undefined,
      type: [buildSchema(
        config,
        field.fields,
        {
          options: {
            _id: false,
            id: false,
            minimize: false,
          },
          allowIDField: true,
          disableUnique: buildSchemaOptions.disableUnique,
          draftsEnabled: buildSchemaOptions.draftsEnabled,
        },
      )],
    };

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, config.localization),
    });
  },
  group: (field: GroupField, schema: Schema, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions): void => {
    const formattedBaseSchema = formatBaseSchema(field, buildSchemaOptions);

    const baseSchema = {
      ...formattedBaseSchema,
      type: buildSchema(
        config,
        field.fields,
        {
          options: {
            _id: false,
            id: false,
            minimize: false,
          },
          disableUnique: buildSchemaOptions.disableUnique,
          draftsEnabled: buildSchemaOptions.draftsEnabled,
        },
      ),
    };

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, config.localization),
    });
  },
  select: (field: SelectField, schema: Schema, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions): void => {
    const baseSchema = {
      ...formatBaseSchema(field, buildSchemaOptions),
      type: String,
      enum: field.options.map((option) => {
        if (typeof option === 'object') return option.value;
        return option;
      }),
    };

    if (buildSchemaOptions.draftsEnabled || !field.required) {
      baseSchema.enum.push(null);
    }

    schema.add({
      [field.name]: localizeSchema(
        field,
        field.hasMany ? [baseSchema] : baseSchema,
        config.localization,
      ),
    });
  },
  blocks: (field: BlockField, schema: Schema, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions): void => {
    const fieldSchema = {
      default: undefined,
      type: [new Schema({}, { _id: false, discriminatorKey: 'blockType' })],
    };

    schema.add({
      [field.name]: localizeSchema(field, fieldSchema, config.localization),
    });

    field.blocks.forEach((blockItem: Block) => {
      const blockSchema = new Schema({}, { _id: false, id: false });

      blockItem.fields.forEach((blockField) => {
        const addFieldSchema: FieldSchemaGenerator = fieldToSchemaMap[blockField.type];
        if (addFieldSchema) {
          addFieldSchema(blockField, blockSchema, config, buildSchemaOptions);
        }
      });

      if (field.localized && config.localization) {
        config.localization.locales.forEach((locale) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore Possible incorrect typing in mongoose types, this works
          schema.path(`${field.name}.${locale}`).discriminator(blockItem.slug, blockSchema);
        });
      } else {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore Possible incorrect typing in mongoose types, this works
        schema.path(field.name).discriminator(blockItem.slug, blockSchema);
      }
    });
  },
};

export default buildSchema;
