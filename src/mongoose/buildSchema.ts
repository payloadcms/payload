/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-use-before-define */
import { Schema, SchemaDefinition, SchemaOptions } from 'mongoose';
import { SanitizedConfig } from '../config/types';
import { ArrayField, Block, BlockField, CheckboxField, CodeField, DateField, EmailField, Field, fieldAffectsData, GroupField, NumberField, PointField, RadioField, RelationshipField, RichTextField, RowField, SelectField, TextareaField, TextField, UploadField, fieldIsPresentationalOnly, NonPresentationalField } from '../fields/config/types';
import sortableFieldTypes from '../fields/sortableFieldTypes';

export type BuildSchemaOptions = {
  options?: SchemaOptions
  allowIDField?: boolean
  disableUnique?: boolean
  global?: boolean
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

        if (blockFieldType.localized) {
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

const formatBaseSchema = (field: NonPresentationalField, buildSchemaOptions: BuildSchemaOptions) => ({
  sparse: field.unique && field.localized,
  unique: (!buildSchemaOptions.disableUnique && field.unique) || false,
  required: false,
  default: field.defaultValue || undefined,
  index: field.index || field.unique || false,
});

const localizeSchema = (field: NonPresentationalField, schema, locales) => {
  if (field.localized) {
    return {
      type: locales.reduce((localeSchema, locale) => ({
        ...localeSchema,
        [locale]: schema,
      }), {
        _id: false,
      }),
      localized: true,
      index: schema.index,
    };
  }
  return schema;
};

const buildSchema = (config: SanitizedConfig, configFields: Field[], buildSchemaOptions: BuildSchemaOptions = {}): Schema => {
  const { allowIDField, options } = buildSchemaOptions;
  let fields = {};
  let schemaFields = configFields;
  const indexFields = [];

  if (!allowIDField) {
    const idField = schemaFields.find((field) => fieldAffectsData(field) && field.name === 'id');
    if (idField) {
      fields = {
        _id: idField.type === 'number' ? Number : String,
      };
      schemaFields = schemaFields.filter((field) => fieldAffectsData(field) && field.name !== 'id');
    }
  }

  schemaFields.forEach((field) => {
    if (!fieldIsPresentationalOnly(field)) {
      const fieldSchema: FieldSchemaGenerator = fieldToSchemaMap[field.type];

      if (fieldSchema) {
        fields = fieldSchema(field, fields, config, buildSchemaOptions);
      }

      // geospatial field index must be created after the schema is created
      if (fieldIndexMap[field.type]) {
        indexFields.push(...fieldIndexMap[field.type](field, config));
      }

      if (config.indexSortableFields && !buildSchemaOptions.global && !field.index && !field.hidden && sortableFieldTypes.indexOf(field.type) > -1 && fieldAffectsData(field)) {
        indexFields.push({ [field.name]: 1 });
      }
    }
  });

  if (buildSchemaOptions?.options?.timestamps) {
    indexFields.push({ createdAt: 1 });
    indexFields.push({ updatedAt: 1 });
  }

  const schema = new Schema(fields, options);
  indexFields.forEach((index) => {
    schema.index(index);
  });

  setBlockDiscriminators(configFields, schema, config, buildSchemaOptions);

  return schema;
};

const fieldIndexMap = {
  point: (field: PointField, config: SanitizedConfig) => {
    if (field.localized) {
      return config.localization.locales.map((locale) => ({ [`${field.name}.${locale}`]: field.index === false ? undefined : field.index || '2dsphere' }));
    }
    return [{ [field.name]: field.index === false ? undefined : field.index || '2dsphere' }];
  },
};

const fieldToSchemaMap = {
  number: (field: NumberField, fields: SchemaDefinition, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions): SchemaDefinition => {
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: Number };

    return {
      ...fields,
      [field.name]: localizeSchema(field, baseSchema, config.localization.locales),
    };
  },
  text: (field: TextField, fields: SchemaDefinition, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions): SchemaDefinition => {
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: String };

    return {
      ...fields,
      [field.name]: localizeSchema(field, baseSchema, config.localization.locales),
    };
  },
  email: (field: EmailField, fields: SchemaDefinition, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions): SchemaDefinition => {
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: String };

    return {
      ...fields,
      [field.name]: localizeSchema(field, baseSchema, config.localization.locales),
    };
  },
  textarea: (field: TextareaField, fields: SchemaDefinition, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions): SchemaDefinition => {
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: String };

    return {
      ...fields,
      [field.name]: localizeSchema(field, baseSchema, config.localization.locales),
    };
  },
  richText: (field: RichTextField, fields: SchemaDefinition, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions): SchemaDefinition => {
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: Schema.Types.Mixed };

    return {
      ...fields,
      [field.name]: localizeSchema(field, baseSchema, config.localization.locales),
    };
  },
  code: (field: CodeField, fields: SchemaDefinition, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions): SchemaDefinition => {
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: String };

    return {
      ...fields,
      [field.name]: localizeSchema(field, baseSchema, config.localization.locales),
    };
  },
  point: (field: PointField, fields: SchemaDefinition, config: SanitizedConfig): SchemaDefinition => {
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

    return {
      ...fields,
      [field.name]: localizeSchema(field, baseSchema, config.localization.locales),
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

    return {
      ...fields,
      [field.name]: localizeSchema(field, baseSchema, config.localization.locales),
    };
  },
  checkbox: (field: CheckboxField, fields: SchemaDefinition, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions): SchemaDefinition => {
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: Boolean };

    return {
      ...fields,
      [field.name]: localizeSchema(field, baseSchema, config.localization.locales),
    };
  },
  date: (field: DateField, fields: SchemaDefinition, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions): SchemaDefinition => {
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: Date };

    return {
      ...fields,
      [field.name]: localizeSchema(field, baseSchema, config.localization.locales),
    };
  },
  upload: (field: UploadField, fields: SchemaDefinition, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions): SchemaDefinition => {
    const baseSchema = {
      ...formatBaseSchema(field, buildSchemaOptions),
      type: Schema.Types.Mixed,
      ref: field.relationTo,
    };

    return {
      ...fields,
      [field.name]: localizeSchema(field, baseSchema, config.localization.locales),
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

      if (fieldSchemaMap && fieldAffectsData(rowField)) {
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
        disableUnique: buildSchemaOptions.disableUnique,
      })],
    };

    return {
      ...fields,
      [field.name]: localizeSchema(field, baseSchema, config.localization.locales),
    };
  },
  group: (field: GroupField, fields: SchemaDefinition, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions): SchemaDefinition => {
    let { required } = field;
    if (field?.admin?.condition || field?.localized || field?.access?.create) required = false;

    const formattedBaseSchema = formatBaseSchema(field, buildSchemaOptions);

    const baseSchema = {
      ...formattedBaseSchema,
      required: required && field.fields.some((subField) => (!fieldIsPresentationalOnly(subField) && subField.required && !subField.localized && !subField?.admin?.condition && !subField?.access?.create)),
      type: buildSchema(config, field.fields, {
        options: {
          _id: false,
          id: false,
        },
        disableUnique: buildSchemaOptions.disableUnique,
      }),
    };

    return {
      ...fields,
      [field.name]: localizeSchema(field, baseSchema, config.localization.locales),
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
    const schemaToReturn = localizeSchema(field, baseSchema, config.localization.locales);

    return {
      ...fields,
      [field.name]: field.hasMany ? [schemaToReturn] : schemaToReturn,
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
