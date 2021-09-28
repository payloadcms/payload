/* eslint-disable no-use-before-define */
import { Schema, SchemaDefinition, SchemaOptions } from 'mongoose';
import { SanitizedConfig } from '../config/types';
import { ArrayField, Block, BlockField, Field, GroupField, RadioField, RelationshipField, RowField, SelectField, UploadField } from '../fields/config/types';

type BuildSchemaOptions = {
  options?: SchemaOptions
  allowIDField?: boolean
  disableRequired?: boolean
}

type FieldSchemaGenerator = (field: Field, fields: SchemaDefinition, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions) => SchemaDefinition;

const setBlockDiscriminators = (fields: Field[], schema: Schema, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions) => {
  fields.forEach((field) => {
    const blockFieldType = field as BlockField;
    if (blockFieldType.type === 'blocks' && blockFieldType.blocks && blockFieldType.blocks.length > 0) {
      blockFieldType.blocks.forEach((blockItem: Block) => {
        let blockSchemaFields = {};

        blockItem.fields.forEach((blockField) => {
          const fieldSchema: FieldSchemaGenerator = fieldToSchemaMap[blockField.type];
          if (fieldSchema) {
            blockSchemaFields = fieldSchema(blockField, blockSchemaFields, config, buildSchemaOptions);
          }
        });

        const blockSchema = new Schema(blockSchemaFields, { _id: false, id: false });

        if (field.localized) {
          config.localization.locales.forEach((locale) => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore Possible incorrect typing in mongoose types, this works
            schema.path(`${field.name}.${locale}`).discriminator(blockItem.slug, blockSchema);
            setBlockDiscriminators(blockItem.fields, blockSchema, config, buildSchemaOptions);
          });
        } else {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore Possible incorrect typing in mongoose types, this works
          schema.path(field.name).discriminator(blockItem.slug, blockSchema);
          setBlockDiscriminators(blockItem.fields, blockSchema, config, buildSchemaOptions);
        }
      });
    }
  });
};

const formatBaseSchema = (field: Field, buildSchemaOptions: BuildSchemaOptions) => ({
  sparse: field.unique && field.localized,
  unique: field.unique || false,
  required: (!buildSchemaOptions.disableRequired && field.required && !field.localized && !field?.admin?.condition && !field?.access?.create) || false,
  default: field.defaultValue || undefined,
  index: field.index || field.unique || false,
});

const buildSchema = (config: SanitizedConfig, configFields: Field[], buildSchemaOptions: BuildSchemaOptions = {}): Schema => {
  const { allowIDField, options } = buildSchemaOptions;
  let fields = {};
  let schemaFields = configFields;
  const indexFields = [];

  if (!allowIDField) {
    const idField = schemaFields.find(({ name }) => name === 'id');
    if (idField) {
      fields = {
        _id: idField.type === 'number' ? Number : String,
      };
      schemaFields = schemaFields.filter(({ name }) => name !== 'id');
    }
  }

  schemaFields.forEach((field) => {
    const fieldSchema: FieldSchemaGenerator = fieldToSchemaMap[field.type];

    if (fieldSchema) {
      fields = fieldSchema(field, fields, config, buildSchemaOptions);
    }
    // geospatial field index must be created after the schema is created
    if (fieldIndexMap[field.type]) {
      indexFields.push(...fieldIndexMap[field.type](field, config));
    }
  });

  const schema = new Schema(fields, options);
  indexFields.forEach((index) => {
    schema.index(index);
  });

  setBlockDiscriminators(configFields, schema, config, buildSchemaOptions);

  return schema;
};

const fieldIndexMap = {
  point: (field: Field, config: SanitizedConfig) => {
    if (field.localized) {
      return config.localization.locales.map((locale) => ({ [`${field.name}.${locale}`]: field.index === false ? undefined : field.index || '2dsphere' }));
    }
    return [{ [field.name]: field.index === false ? undefined : field.index || '2dsphere' }];
  },
};

const fieldToSchemaMap = {
  number: (field: Field, fields: SchemaDefinition, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions): SchemaDefinition => {
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: Number };
    let schemaToReturn;

    if (field.localized) {
      schemaToReturn = {
        type: config.localization.locales.reduce((localeSchema, locale) => ({
          ...localeSchema,
          [locale]: baseSchema,
        }), {}),
        localized: true,
      };
    } else {
      schemaToReturn = baseSchema;
    }

    return {
      ...fields,
      [field.name]: schemaToReturn,
    };
  },
  text: (field: Field, fields: SchemaDefinition, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions): SchemaDefinition => {
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: String };
    let schemaToReturn;

    if (field.localized) {
      schemaToReturn = {
        type: config.localization.locales.reduce((localeSchema, locale) => ({
          ...localeSchema,
          [locale]: baseSchema,
        }), {}),
        localized: true,
      };
    } else {
      schemaToReturn = baseSchema;
    }

    return {
      ...fields,
      [field.name]: schemaToReturn,
    };
  },
  email: (field: Field, fields: SchemaDefinition, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions): SchemaDefinition => {
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: String };
    let schemaToReturn;

    if (field.localized) {
      schemaToReturn = {
        type: config.localization.locales.reduce((localeSchema, locale) => ({
          ...localeSchema,
          [locale]: baseSchema,
        }), {}),
        localized: true,
      };
    } else {
      schemaToReturn = baseSchema;
    }

    return {
      ...fields,
      [field.name]: schemaToReturn,
    };
  },
  textarea: (field: Field, fields: SchemaDefinition, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions): SchemaDefinition => {
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: String };
    let schemaToReturn;

    if (field.localized) {
      schemaToReturn = {
        type: config.localization.locales.reduce((localeSchema, locale) => ({
          ...localeSchema,
          [locale]: baseSchema,
        }), {}),
        localized: true,
      };
    } else {
      schemaToReturn = baseSchema;
    }

    return {
      ...fields,
      [field.name]: schemaToReturn,
    };
  },
  richText: (field: Field, fields: SchemaDefinition, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions): SchemaDefinition => {
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: Schema.Types.Mixed };
    let schemaToReturn;

    if (field.localized) {
      schemaToReturn = {
        type: config.localization.locales.reduce((localeSchema, locale) => ({
          ...localeSchema,
          [locale]: baseSchema,
        }), {}),
        localized: true,
      };
    } else {
      schemaToReturn = baseSchema;
    }

    return {
      ...fields,
      [field.name]: schemaToReturn,
    };
  },
  code: (field: Field, fields: SchemaDefinition, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions): SchemaDefinition => {
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: String };
    let schemaToReturn;

    if (field.localized) {
      schemaToReturn = {
        type: config.localization.locales.reduce((localeSchema, locale) => ({
          ...localeSchema,
          [locale]: baseSchema,
        }), {}),
        localized: true,
      };
    } else {
      schemaToReturn = baseSchema;
    }

    return {
      ...fields,
      [field.name]: schemaToReturn,
    };
  },
  point: (field: Field, fields: SchemaDefinition, config: SanitizedConfig): SchemaDefinition => {
    const baseSchema = {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
        sparse: field.unique && field.localized,
        unique: field.unique || false,
        required: (field.required && !field.localized && !field?.admin?.condition && !field?.access?.create) || false,
        default: field.defaultValue || undefined,
      },
    };
    let schemaToReturn;

    if (field.localized) {
      schemaToReturn = {
        type: config.localization.locales.reduce((localeSchema, locale) => ({
          ...localeSchema,
          [locale]: baseSchema,
        }), {}),
        localized: true,
      };
    } else {
      schemaToReturn = baseSchema;
    }

    return {
      ...fields,
      [field.name]: schemaToReturn,
    };
  },
  radio: (field: RadioField, fields: SchemaDefinition, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions): SchemaDefinition => {
    const baseSchema = {
      ...formatBaseSchema(field, buildSchemaOptions),
      type: String,
      enum: field.options.map((option) => {
        if (typeof option === 'object') return option.value;
        return option;
      }),
    };
    let schemaToReturn;

    if (field.localized) {
      schemaToReturn = {
        type: config.localization.locales.reduce((localeSchema, locale) => ({
          ...localeSchema,
          [locale]: baseSchema,
        }), {}),
        localized: true,
      };
    } else {
      schemaToReturn = baseSchema;
    }

    return {
      ...fields,
      [field.name]: schemaToReturn,
    };
  },
  checkbox: (field: Field, fields: SchemaDefinition, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions): SchemaDefinition => {
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: Boolean };
    let schemaToReturn;

    if (field.localized) {
      schemaToReturn = {
        type: config.localization.locales.reduce((localeSchema, locale) => ({
          ...localeSchema,
          [locale]: baseSchema,
        }), {}),
        localized: true,
      };
    } else {
      schemaToReturn = baseSchema;
    }

    return {
      ...fields,
      [field.name]: schemaToReturn,
    };
  },
  date: (field: Field, fields: SchemaDefinition, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions): SchemaDefinition => {
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: Date };
    let schemaToReturn;

    if (field.localized) {
      schemaToReturn = {
        type: config.localization.locales.reduce((localeSchema, locale) => ({
          ...localeSchema,
          [locale]: baseSchema,
        }), {}),
        localized: true,
      };
    } else {
      schemaToReturn = baseSchema;
    }

    return {
      ...fields,
      [field.name]: schemaToReturn,
    };
  },
  upload: (field: UploadField, fields: SchemaDefinition, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions): SchemaDefinition => {
    const baseSchema = {
      ...formatBaseSchema(field, buildSchemaOptions),
      type: Schema.Types.Mixed,
      ref: field.relationTo,
    };

    let schemaToReturn;

    if (field.localized) {
      schemaToReturn = {
        type: config.localization.locales.reduce((localeSchema, locale) => ({
          ...localeSchema,
          [locale]: baseSchema,
        }), {}),
        localized: true,
      };
    } else {
      schemaToReturn = baseSchema;
    }

    return {
      ...fields,
      [field.name]: schemaToReturn,
    };
  },
  relationship: (field: RelationshipField, fields: SchemaDefinition, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions) => {
    const hasManyRelations = Array.isArray(field.relationTo);
    let schemaToReturn: { [key: string]: any } = {};

    if (field.localized) {
      schemaToReturn = {
        type: config.localization.locales.reduce((locales, locale) => {
          let localeSchema: { [key: string]: any } = {};

          if (hasManyRelations) {
            localeSchema._id = false;
            localeSchema.value = {
              type: Schema.Types.Mixed,
              refPath: `${field.name}.${locale}.relationTo`,
            };
            localeSchema.relationTo = { type: String, enum: field.relationTo };
          } else {
            localeSchema = {
              ...formatBaseSchema(field, buildSchemaOptions),
              type: Schema.Types.Mixed,
              ref: field.relationTo,
            };
          }

          return {
            ...locales,
            [locale]: field.hasMany ? [localeSchema] : localeSchema,
          };
        }, {}),
        localized: true,
      };
    } else if (hasManyRelations) {
      schemaToReturn._id = false;
      schemaToReturn.value = {
        type: Schema.Types.Mixed,
        refPath: `${field.name}.relationTo`,
      };
      schemaToReturn.relationTo = { type: String, enum: field.relationTo };

      if (field.hasMany) schemaToReturn = [schemaToReturn];
    } else {
      schemaToReturn = {
        ...formatBaseSchema(field, buildSchemaOptions),
        type: Schema.Types.Mixed,
        ref: field.relationTo,
      };

      if (field.hasMany) schemaToReturn = [schemaToReturn];
    }

    return {
      ...fields,
      [field.name]: schemaToReturn,
    };
  },
  row: (field: RowField, fields: SchemaDefinition, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions): SchemaDefinition => {
    const newFields = { ...fields };

    field.fields.forEach((rowField: Field) => {
      const fieldSchemaMap: FieldSchemaGenerator = fieldToSchemaMap[rowField.type];

      if (fieldSchemaMap) {
        const fieldSchema = fieldSchemaMap(rowField, fields, config, buildSchemaOptions);
        newFields[rowField.name] = fieldSchema[rowField.name];
      }
    });

    return newFields;
  },
  array: (field: ArrayField, fields: SchemaDefinition, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions) => {
    const baseSchema = {
      ...formatBaseSchema(field, buildSchemaOptions),
      type: [buildSchema(config, field.fields, {
        options: { _id: false, id: false },
        allowIDField: true,
      })],
    };

    let schemaToReturn;

    if (field.localized) {
      schemaToReturn = {
        type: config.localization.locales.reduce((localeSchema, locale) => ({
          ...localeSchema,
          [locale]: baseSchema,
        }), {}),
        localized: true,
      };
    } else {
      schemaToReturn = baseSchema;
    }

    return {
      ...fields,
      [field.name]: schemaToReturn,
    };
  },
  group: (field: GroupField, fields: SchemaDefinition, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions): SchemaDefinition => {
    let { required } = field;
    if (field?.admin?.condition || field?.localized || field?.access?.create) required = false;

    const formattedBaseSchema = formatBaseSchema(field, buildSchemaOptions);

    const baseSchema = {
      ...formattedBaseSchema,
      required: required && field.fields.some((subField) => (subField.required && !subField.localized && !subField?.admin?.condition && !subField?.access?.create)),
      type: buildSchema(config, field.fields, {
        options: {
          _id: false,
          id: false,
        },
        disableRequired: !formattedBaseSchema.required,
      }),
    };

    let schemaToReturn;

    if (field.localized) {
      schemaToReturn = {
        type: config.localization.locales.reduce((localeSchema, locale) => ({
          ...localeSchema,
          [locale]: baseSchema,
        }), {}),
        localized: true,
      };
    } else {
      schemaToReturn = baseSchema;
    }

    return {
      ...fields,
      [field.name]: schemaToReturn,
    };
  },
  select: (field: SelectField, fields: SchemaDefinition, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions): SchemaDefinition => {
    const baseSchema = {
      ...formatBaseSchema(field, buildSchemaOptions),
      type: String,
      enum: field.options.map((option) => {
        if (typeof option === 'object') return option.value;
        return option;
      }),
    };

    let schemaToReturn;

    if (field.localized) {
      schemaToReturn = {
        type: config.localization.locales.reduce((localeSchema, locale) => ({
          ...localeSchema,
          [locale]: baseSchema,
        }), {}),
        localized: true,
      };
    } else {
      schemaToReturn = baseSchema;
    }

    if (field.hasMany) schemaToReturn = [schemaToReturn];

    return {
      ...fields,
      [field.name]: schemaToReturn,
    };
  },
  blocks: (field: BlockField, fields: SchemaDefinition, config: SanitizedConfig): SchemaDefinition => {
    const baseSchema = [new Schema({ }, { _id: false, discriminatorKey: 'blockType' })];
    let schemaToReturn;

    if (field.localized) {
      schemaToReturn = config.localization.locales.reduce((localeSchema, locale) => ({
        ...localeSchema,
        [locale]: baseSchema,
      }), {});
    } else {
      schemaToReturn = baseSchema;
    }

    return {
      ...fields,
      [field.name]: schemaToReturn,
    };
  },
};

export default buildSchema;
