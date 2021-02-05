/* eslint-disable no-use-before-define */
import { Schema, SchemaDefinition } from 'mongoose';
import { Config } from '../config/types';
import { MissingFieldInputOptions } from '../errors';
import { ArrayField, Block, BlockField, Field, GroupField, RadioField, RelationshipField, RowField, SelectField, UploadField } from '../fields/config/types';
import localizationPlugin from '../localization/plugin';

type FieldSchemaGenerator = (field: Field, fields: SchemaDefinition, config: Config) => SchemaDefinition;

const setBlockDiscriminators = (fields: Field[], schema: Schema, config: Config) => {
  fields.forEach((field) => {
    const blockFieldType = field as BlockField;
    if (blockFieldType.type === 'blocks' && blockFieldType.blocks && blockFieldType.blocks.length > 0) {
      blockFieldType.blocks.forEach((blockItem: Block) => {
        let blockSchemaFields = {};

        blockItem.fields.forEach((blockField) => {
          const fieldSchema: FieldSchemaGenerator = fieldToSchemaMap[blockField.type];
          if (fieldSchema) {
            blockSchemaFields = fieldSchema(blockField, blockSchemaFields, config);
          }
        });

        const blockSchema = new Schema(blockSchemaFields, { _id: false });

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore Possible incorrect typing in mongoose types, this works
        schema.path(field.name).discriminator(blockItem.slug, blockSchema);

        if (config.localization) {
          blockSchema.plugin(localizationPlugin, config.localization);
        }

        setBlockDiscriminators(blockItem.fields, blockSchema, config);
      });
    }
  });
};

const formatBaseSchema = (field: Field) => {
  const createAccess = field.access && field.access.create;

  const condition = field.admin && field.admin.condition;

  return {
    localized: field.localized || false,
    unique: field.unique || false,
    required: (field.required && !field.localized && !condition && !createAccess) || false,
    default: field.defaultValue || undefined,
    index: field.index || field.unique || false,
  };
};

const buildSchema = (config: Config, configFields: Field[], options = {}): Schema => {
  let fields = {};

  configFields.forEach((field) => {
    const fieldSchema: FieldSchemaGenerator = fieldToSchemaMap[field.type];

    if (fieldSchema) {
      fields = fieldSchema(field, fields, config);
    }
  });

  const schema = new Schema(fields, options);

  setBlockDiscriminators(configFields, schema, config);

  return schema;
};

const fieldToSchemaMap = {
  number: (field: Field, fields: SchemaDefinition): SchemaDefinition => ({
    ...fields,
    [field.name]: { ...formatBaseSchema(field), type: Number },
  }),
  text: (field: Field, fields: SchemaDefinition): SchemaDefinition => ({
    ...fields,
    [field.name]: { ...formatBaseSchema(field), type: String },
  }),
  email: (field: Field, fields: SchemaDefinition): SchemaDefinition => ({
    ...fields,
    [field.name]: { ...formatBaseSchema(field), type: String },
  }),
  textarea: (field: Field, fields: SchemaDefinition): SchemaDefinition => ({
    ...fields,
    [field.name]: { ...formatBaseSchema(field), type: String },
  }),
  richText: (field: Field, fields: SchemaDefinition): SchemaDefinition => ({
    ...fields,
    [field.name]: { ...formatBaseSchema(field), type: Schema.Types.Mixed },
  }),
  code: (field: Field, fields: SchemaDefinition): SchemaDefinition => ({
    ...fields,
    [field.name]: { ...formatBaseSchema(field), type: String },
  }),
  radio: (field: RadioField, fields: SchemaDefinition) => {
    if (!field.options || field.options.length === 0) {
      throw new MissingFieldInputOptions(field);
    }

    const schema = {
      ...formatBaseSchema(field),
      type: String,
      enum: field.options.map((option) => {
        if (typeof option === 'object') return option.value;
        return option;
      }),
    };

    return {
      ...fields,
      [field.name]: schema,
    };
  },
  checkbox: (field: Field, fields: SchemaDefinition): SchemaDefinition => ({
    ...fields,
    [field.name]: { ...formatBaseSchema(field), type: Boolean },
  }),
  date: (field: Field, fields: SchemaDefinition): SchemaDefinition => ({
    ...fields,
    [field.name]: { ...formatBaseSchema(field), type: Date },
  }),
  upload: (field: UploadField, fields: SchemaDefinition): SchemaDefinition => ({
    ...fields,
    [field.name]: {
      ...formatBaseSchema(field),
      type: Schema.Types.ObjectId,
      ref: field.relationTo,
    },
  }),
  relationship: (field: RelationshipField, fields: SchemaDefinition) => {
    let schema: { [key: string]: any } = {};

    if (Array.isArray(field.relationTo)) {
      schema._id = false;
      schema.value = {
        type: Schema.Types.ObjectId,
        refPath: `${field.name}${field.localized ? '.{{LOCALE}}' : ''}.relationTo`,
      };
      schema.relationTo = { type: String, enum: field.relationTo };
    } else {
      schema = {
        ...formatBaseSchema(field),
      };

      schema.type = Schema.Types.ObjectId;
      schema.ref = field.relationTo;
    }

    if (field.hasMany) {
      schema = {
        type: [schema],
        localized: field.localized || false,
      };
    }

    return {
      ...fields,
      [field.name]: schema,
    };
  },
  row: (field: RowField, fields: SchemaDefinition, config: Config): SchemaDefinition => {
    const newFields = { ...fields };

    field.fields.forEach((rowField: Field) => {
      const fieldSchemaMap: FieldSchemaGenerator = fieldToSchemaMap[rowField.type];

      if (fieldSchemaMap) {
        const fieldSchema = fieldSchemaMap(rowField, fields, config);
        newFields[rowField.name] = fieldSchema[rowField.name];
      }
    });

    return newFields;
  },
  array: (field: ArrayField, fields: SchemaDefinition, config: Config) => {
    const schema = buildSchema(config, field.fields, { _id: false, id: false });

    return {
      ...fields,
      [field.name]: {
        ...formatBaseSchema(field),
        type: [schema],
      },
    };
  },
  group: (field: GroupField, fields: SchemaDefinition, config: Config): SchemaDefinition => {
    const schema = buildSchema(config, field.fields, { _id: false, id: false });

    return {
      ...fields,
      [field.name]: {
        ...formatBaseSchema(field),
        required: field.fields.some((subField) => subField.required === true),
        type: schema,
      },
    };
  },
  select: (field: SelectField, fields: SchemaDefinition) => {
    if (!field.options || field.options.length === 0) {
      throw new MissingFieldInputOptions(field);
    }

    const schema = {
      ...formatBaseSchema(field),
      type: String,
      enum: field.options.map((option) => {
        if (typeof option === 'object') return option.value;
        return option;
      }),
    };

    return {
      ...fields,
      [field.name]: field.hasMany ? [schema] : schema,
    };
  },
  blocks: (field: BlockField, fields: SchemaDefinition) => {
    const blocksSchema = new Schema({ blockName: String }, { discriminatorKey: 'blockType', _id: false, id: false });

    return {
      ...fields,
      [field.name]: {
        type: [blocksSchema],
        localized: field.localized || false,
      },
    };
  },
};

export default buildSchema;
