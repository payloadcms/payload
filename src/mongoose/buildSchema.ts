/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-use-before-define */
import { IndexDefinition, IndexOptions, Schema, SchemaOptions } from 'mongoose';
import { SanitizedConfig } from '../config/types';
import { ArrayField, Block, BlockField, CheckboxField, CodeField, CollapsibleField, DateField, EmailField, Field, fieldAffectsData, fieldIsPresentationalOnly, GroupField, NonPresentationalField, NumberField, PointField, RadioField, RelationshipField, RichTextField, RowField, SelectField, TabsField, TextareaField, TextField, UploadField } from '../fields/config/types';
import sortableFieldTypes from '../fields/sortableFieldTypes';

export type BuildSchemaOptions = {
  options?: SchemaOptions
  allowIDField?: boolean
  disableUnique?: boolean
  global?: boolean
}

type FieldSchemaGenerator = (field: Field, schema: Schema, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions, indexes: Index[]) => void;

type Index = {
  index: IndexDefinition
  options?: IndexOptions
}

const formatBaseSchema = (field: NonPresentationalField, buildSchemaOptions: BuildSchemaOptions) => ({
  sparse: field.unique && field.localized,
  unique: (!buildSchemaOptions.disableUnique && field.unique) || false,
  required: false,
  index: field.index || field.unique || false,
});

const localizeSchema = (field: NonPresentationalField, schema, localization) => {
  if (field.localized && localization && Array.isArray(localization.locales)) {
    return {
      type: localization.locales.reduce((localeSchema, locale) => ({
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
  const indexes: Index[] = [];

  let schemaFields = configFields;

  if (!allowIDField) {
    const idField = schemaFields.find((field) => fieldAffectsData(field) && field.name === 'id');
    if (idField) {
      fields = {
        _id: idField.type === 'number' ? Number : String,
      };
      schemaFields = schemaFields.filter((field) => fieldAffectsData(field) && field.name !== 'id');
    }
  }

  const schema = new Schema(fields, options);

  schemaFields.forEach((field) => {
    if (!fieldIsPresentationalOnly(field)) {
      const addFieldSchema: FieldSchemaGenerator = fieldToSchemaMap[field.type];

      if (addFieldSchema) {
        addFieldSchema(field, schema, config, buildSchemaOptions, indexes);
      }
    }
  });

  if (buildSchemaOptions?.options?.timestamps) {
    indexes.push({ index: { createdAt: 1 } });
    indexes.push({ index: { updatedAt: 1 } });
  }

  // mongoose on mongoDB 5 or 6 need to call this to make the index in the database, schema indexes alone are not enough
  indexes.forEach((indexField) => {
    schema.index(indexField.index, indexField.options);
  });

  return schema;
};

const addFieldIndex = (field: NonPresentationalField, indexFields: Index[], config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions) => {
  if (config.indexSortableFields && !buildSchemaOptions.global && !field.index && !field.hidden && sortableFieldTypes.indexOf(field.type) > -1 && fieldAffectsData(field)) {
    indexFields.push({ index: { [field.name]: 1 } });
  } else if (field.unique && fieldAffectsData(field)) {
    indexFields.push({
      index: { [field.name]: 1 },
      options: {
        unique: !buildSchemaOptions.disableUnique,
        sparse: field.localized || false,
      },
    });
  } else if (field.index && fieldAffectsData(field)) {
    indexFields.push({ index: { [field.name]: 1 } });
  }
};

const fieldToSchemaMap: Record<string, FieldSchemaGenerator> = {
  number: (field: NumberField, schema: Schema, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions, indexes: Index[]): void => {
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: Number };

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, config.localization),
    });
    addFieldIndex(field, indexes, config, buildSchemaOptions);
  },
  text: (field: TextField, schema: Schema, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions, indexes: Index[]): void => {
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: String };

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, config.localization),
    });
    addFieldIndex(field, indexes, config, buildSchemaOptions);
  },
  email: (field: EmailField, schema: Schema, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions, indexes: Index[]): void => {
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: String };

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, config.localization),
    });
    addFieldIndex(field, indexes, config, buildSchemaOptions);
  },
  textarea: (field: TextareaField, schema: Schema, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions, indexes: Index[]): void => {
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: String };

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, config.localization),
    });
    addFieldIndex(field, indexes, config, buildSchemaOptions);
  },
  richText: (field: RichTextField, schema: Schema, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions, indexes: Index[]): void => {
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: Schema.Types.Mixed };

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, config.localization),
    });
    addFieldIndex(field, indexes, config, buildSchemaOptions);
  },
  code: (field: CodeField, schema: Schema, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions, indexes: Index[]): void => {
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: String };

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, config.localization),
    });
    addFieldIndex(field, indexes, config, buildSchemaOptions);
  },
  point: (field: PointField, schema: Schema, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions, indexes: Index[]): void => {
    const baseSchema = {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
        sparse: (buildSchemaOptions.disableUnique && field.unique) && field.localized,
        unique: (buildSchemaOptions.disableUnique && field.unique) || false,
        required: false,
        default: field.defaultValue || undefined,
      },
    };

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, config.localization),
    });

    // creates geospatial 2dsphere index by default
    let direction;
    const options: IndexOptions = {
      unique: field.unique || false,
      sparse: (field.localized && field.unique) || false,
    };
    if (field.index === true || field.index === undefined) {
      direction = '2dsphere';
    }
    if (field.localized && config.localization) {
      indexes.push(
        ...config.localization.locales.map((locale) => ({
          index: { [`${field.name}.${locale}`]: direction },
          options,
        })),
      );
    } else {
      if (field.unique) {
        options.unique = true;
      }
      indexes.push({ index: { [field.name]: direction }, options });
    }
  },
  radio: (field: RadioField, schema: Schema, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions, indexes: Index[]): void => {
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
    addFieldIndex(field, indexes, config, buildSchemaOptions);
  },
  checkbox: (field: CheckboxField, schema: Schema, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions, indexes: Index[]): void => {
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: Boolean };

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, config.localization),
    });
    addFieldIndex(field, indexes, config, buildSchemaOptions);
  },
  date: (field: DateField, schema: Schema, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions, indexes: Index[]): void => {
    const baseSchema = { ...formatBaseSchema(field, buildSchemaOptions), type: Date };

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, config.localization),
    });
    addFieldIndex(field, indexes, config, buildSchemaOptions);
  },
  upload: (field: UploadField, schema: Schema, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions, indexes: Index[]): void => {
    const baseSchema = {
      ...formatBaseSchema(field, buildSchemaOptions),
      type: Schema.Types.Mixed,
      ref: field.relationTo,
    };

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, config.localization),
    });
    addFieldIndex(field, indexes, config, buildSchemaOptions);
  },
  relationship: (field: RelationshipField, schema: Schema, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions, indexes: Index[]) => {
    const hasManyRelations = Array.isArray(field.relationTo);
    let schemaToReturn: { [key: string]: any } = {};

    if (field.localized && config.localization) {
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

    schema.add({
      [field.name]: schemaToReturn,
    });
    addFieldIndex(field, indexes, config, buildSchemaOptions);
  },
  row: (field: RowField, schema: Schema, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions, indexes: Index[]): void => {
    field.fields.forEach((subField: Field) => {
      const addFieldSchema: FieldSchemaGenerator = fieldToSchemaMap[subField.type];

      if (addFieldSchema) {
        addFieldSchema(subField, schema, config, buildSchemaOptions, indexes);
      }
    });
  },
  collapsible: (field: CollapsibleField, schema: Schema, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions, indexes: Index[]): void => {
    field.fields.forEach((subField: Field) => {
      const addFieldSchema: FieldSchemaGenerator = fieldToSchemaMap[subField.type];

      if (addFieldSchema) {
        addFieldSchema(subField, schema, config, buildSchemaOptions, indexes);
      }
    });
  },
  tabs: (field: TabsField, schema: Schema, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions, indexes: Index[]): void => {
    field.tabs.forEach((tab) => {
      tab.fields.forEach((subField: Field) => {
        const addFieldSchema: FieldSchemaGenerator = fieldToSchemaMap[subField.type];

        if (addFieldSchema) {
          addFieldSchema(subField, schema, config, buildSchemaOptions, indexes);
        }
      });
    });
  },
  array: (field: ArrayField, schema: Schema, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions) => {
    const baseSchema = {
      ...formatBaseSchema(field, buildSchemaOptions),
      type: [buildSchema(
        config,
        field.fields,
        {
          options: { _id: false, id: false },
          allowIDField: true,
          disableUnique: buildSchemaOptions.disableUnique,
        },
      )],
    };

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, config.localization),
    });
  },
  group: (field: GroupField, schema: Schema, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions): void => {
    let { required } = field;
    if (field?.admin?.condition || field?.localized || field?.access?.create) required = false;

    const formattedBaseSchema = formatBaseSchema(field, buildSchemaOptions);

    const baseSchema = {
      ...formattedBaseSchema,
      required: required && field.fields.some((subField) => (!fieldIsPresentationalOnly(subField) && subField.required && !subField.localized && !subField?.admin?.condition && !subField?.access?.create)),
      type: buildSchema(
        config,
        field.fields,
        {
          options: {
            _id: false,
            id: false,
          },
          disableUnique: buildSchemaOptions.disableUnique,
        },
      ),
    };

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, config.localization),
    });
  },
  select: (field: SelectField, schema: Schema, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions, indexes: Index[]): void => {
    const baseSchema = {
      ...formatBaseSchema(field, buildSchemaOptions),
      type: String,
      enum: field.options.map((option) => {
        if (typeof option === 'object') return option.value;
        return option;
      }),
    };
    const schemaToReturn = localizeSchema(field, baseSchema, config.localization);

    schema.add({
      [field.name]: field.hasMany ? [schemaToReturn] : schemaToReturn,
    });
    addFieldIndex(field, indexes, config, buildSchemaOptions);
  },
  blocks: (field: BlockField, schema: Schema, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions, indexes: Index[]): void => {
    const fieldSchema = [new Schema({}, { _id: false, discriminatorKey: 'blockType' })];
    let schemaToReturn;

    if (field.localized && config.localization) {
      schemaToReturn = config.localization.locales.reduce((localeSchema, locale) => ({
        ...localeSchema,
        [locale]: fieldSchema,
      }), {});
    } else {
      schemaToReturn = fieldSchema;
    }

    schema.add({
      [field.name]: schemaToReturn,
    });

    field.blocks.forEach((blockItem: Block) => {
      const blockSchema = new Schema({}, { _id: false, id: false });

      blockItem.fields.forEach((blockField) => {
        const addFieldSchema: FieldSchemaGenerator = fieldToSchemaMap[blockField.type];
        if (addFieldSchema) {
          addFieldSchema(blockField, blockSchema, config, buildSchemaOptions, indexes);
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
