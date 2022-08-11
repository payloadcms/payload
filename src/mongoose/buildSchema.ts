/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-use-before-define */
import { IndexDefinition, IndexOptions, Schema, SchemaOptions } from 'mongoose';
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
  fieldAffectsData, fieldIsLocalized,
  fieldIsPresentationalOnly,
  GroupField,
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
import sortableFieldTypes from '../fields/sortableFieldTypes';

export type BuildSchemaOptions = {
  options?: SchemaOptions
  allowIDField?: boolean
  disableUnique?: boolean
  global?: boolean
}

type FieldSchemaGenerator = (field: Field, schema: Schema, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions) => void;

type Index = {
  index: IndexDefinition
  options?: IndexOptions
}

const formatBaseSchema = (field: NonPresentationalField, buildSchemaOptions: BuildSchemaOptions) => ({
  sparse: field.unique && fieldIsLocalized(field),
  unique: (!buildSchemaOptions.disableUnique && field.unique) || false,
  required: false,
  index: field.index || field.unique || false,
});

const localizeSchema = (field: NonPresentationalField | Tab, schema, localization) => {
  if (fieldIsLocalized(field) && localization && Array.isArray(localization.locales)) {
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


  let schemaFields = configFields;
  const indexFields: Index[] = [];

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
        addFieldSchema(field, schema, config, buildSchemaOptions);
      }

      // geospatial field index must be created after the schema is created
      if (fieldIndexMap[field.type]) {
        indexFields.push(...fieldIndexMap[field.type](field, config));
      }

      if (config.indexSortableFields && !buildSchemaOptions.global && !field.index && !field.hidden && sortableFieldTypes.indexOf(field.type) > -1 && fieldAffectsData(field)) {
        indexFields.push({ index: { [field.name]: 1 } });
      } else if (field.unique && fieldAffectsData(field)) {
        indexFields.push({ index: { [field.name]: 1 }, options: { unique: true, sparse: field.localized || false } });
      } else if (field.index && fieldAffectsData(field)) {
        indexFields.push({ index: { [field.name]: 1 } });
      }
    }
  });

  if (buildSchemaOptions?.options?.timestamps) {
    indexFields.push({ index: { createdAt: 1 } });
    indexFields.push({ index: { updatedAt: 1 } });
  }

  indexFields.forEach((indexField) => {
    schema.index(indexField.index, indexField.options);
  });

  return schema;
};

const fieldIndexMap = {
  point: (field: PointField, config: SanitizedConfig) => {
    let direction: boolean | '2dsphere';
    const options: IndexOptions = {
      unique: field.unique || false,
      sparse: (field.localized && field.unique) || false,
    };
    if (field.index === true || field.index === undefined) {
      direction = '2dsphere';
    }
    if (field.localized && config.localization) {
      return config.localization.locales.map((locale) => ({
        index: { [`${field.name}.${locale}`]: direction },
        options,
      }));
    }
    if (field.unique) {
      options.unique = true;
    }
    return [{ index: { [field.name]: direction }, options }];
  },
};

const fieldToSchemaMap = {
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
  point: (field: PointField, schema: Schema, config: SanitizedConfig): void => {
    const baseSchema = {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
        sparse: field.unique && field.localized,
        unique: field.unique || false,
        required: false,
        default: field.defaultValue || undefined,
      },
    };

    schema.add({
      [field.name]: localizeSchema(field, baseSchema, config.localization),
    });
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
        const formattedBaseSchema = formatBaseSchema(field, buildSchemaOptions);

        const baseSchema = {
          ...formattedBaseSchema,
          type: buildSchema(config, tab.fields, {
            options: {
              _id: false,
              id: false,
            },
            disableUnique: buildSchemaOptions.disableUnique,
          }),
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
      type: [buildSchema(config, field.fields, {
        options: { _id: false, id: false },
        allowIDField: true,
        disableUnique: buildSchemaOptions.disableUnique,
      })],
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
      required: required && field.fields.some((subField) => (!fieldIsPresentationalOnly(subField) && subField.required && !fieldIsLocalized(subField) && !subField?.admin?.condition && !subField?.access?.create)),
      type: buildSchema(config, field.fields, {
        options: {
          _id: false,
          id: false,
        },
        disableUnique: buildSchemaOptions.disableUnique,
      }),
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
    const schemaToReturn = localizeSchema(field, baseSchema, config.localization);

    schema.add({
      [field.name]: field.hasMany ? [schemaToReturn] : schemaToReturn,
    });
  },
  blocks: (field: BlockField, schema: Schema, config: SanitizedConfig, buildSchemaOptions: BuildSchemaOptions): void => {
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
