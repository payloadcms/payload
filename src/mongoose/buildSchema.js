/* eslint-disable no-use-before-define */
const { Schema } = require('mongoose');
const { MissingSelectOptions } = require('../errors');

const formatBaseSchema = (field) => {
  const createPolicy = field.policies && field.policies.create;

  return {
    hide: field.hidden === 'api' || field.hidden === true,
    localized: field.localized || false,
    unique: field.unique || false,
    required: (field.required && !field.localized && !field.hidden && !field.condition && !createPolicy) || false,
    default: field.defaultValue || undefined,
  };
};

const buildSchema = (configFields, options = {}) => {
  let fields = {};

  configFields.forEach((field) => {
    const fieldSchema = fieldToSchemaMap[field.type];

    if (fieldSchema) {
      fields = fieldSchema(field, fields);
    }
  });

  const schema = new Schema(fields, options);

  configFields.forEach((field) => {
    if (field.type === 'flexible' && field.blocks && field.blocks.length > 0) {
      field.blocks.forEach((block) => {
        let blockSchemaFields = {};

        block.fields.forEach((blockField) => {
          const fieldSchema = fieldToSchemaMap[blockField.type];
          if (fieldSchema) {
            blockSchemaFields = fieldSchema(blockField, blockSchemaFields);
          }
        });

        const blockSchema = new Schema(blockSchemaFields, { _id: false });
        schema.path(field.name).discriminator(block.slug, blockSchema);
      });
    }
  });

  return schema;
};

const fieldToSchemaMap = {
  number: (field, fields) => {
    return {
      ...fields,
      [field.name]: { ...formatBaseSchema(field), type: Number },
    };
  },
  text: (field, fields) => {
    return {
      ...fields,
      [field.name]: { ...formatBaseSchema(field), type: String },
    };
  },
  email: (field, fields) => {
    return {
      ...fields,
      [field.name]: { ...formatBaseSchema(field), type: String },
    };
  },
  textarea: (field, fields) => {
    return {
      ...fields,
      [field.name]: { ...formatBaseSchema(field), type: String },
    };
  },
  richText: (field, fields) => {
    return {
      ...fields,
      [field.name]: { ...formatBaseSchema(field), type: Schema.Types.Mixed },
    };
  },
  code: (field, fields) => {
    return {
      ...fields,
      [field.name]: { ...formatBaseSchema(field), type: String },
    };
  },
  radio: (field, fields) => {
    return {
      ...fields,
      [field.name]: { ...formatBaseSchema(field), type: String },
    };
  },
  checkbox: (field, fields) => {
    return {
      ...fields,
      [field.name]: { ...formatBaseSchema(field), type: Boolean },
    };
  },
  date: (field, fields) => {
    return {
      ...fields,
      [field.name]: { ...formatBaseSchema(field), type: Date },
    };
  },
  upload: (field, fields) => {
    return {
      ...fields,
      [field.name]: {
        ...formatBaseSchema(field),
        type: Schema.Types.ObjectId,
        autopopulate: true,
        ref: field.relationTo,
      },
    };
  },
  relationship: (field, fields) => {
    let schema = {};

    if (Array.isArray(field.relationTo)) {
      schema.value = {
        type: Schema.Types.ObjectId,
        autopopulate: true,
        refPath: `${field.name}${field.localized ? '.{{LOCALE}}' : ''}.relationTo`,
      };
      schema.relationTo = { type: String, enum: field.relationTo };
    } else {
      schema = {
        ...formatBaseSchema(field),
      };

      schema.type = Schema.Types.ObjectId;
      schema.autopopulate = true;
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
  row: (field, fields) => {
    const newFields = { ...fields };

    field.fields.forEach((rowField) => {
      const fieldSchemaMap = fieldToSchemaMap[rowField.type];

      if (fieldSchemaMap) {
        const fieldSchema = fieldSchemaMap(rowField, fields);
        newFields[rowField.name] = fieldSchema[rowField.name];
      }
    });

    return newFields;
  },
  repeater: (field, fields) => {
    const schema = buildSchema(field.fields, { _id: false, id: false });

    return {
      ...fields,
      [field.name]: {
        ...formatBaseSchema(field),
        type: [schema],
      },
    };
  },
  group: (field, fields) => {
    const schema = buildSchema(field.fields, { _id: false, id: false });

    return {
      ...fields,
      [field.name]: {
        ...formatBaseSchema(field),
        required: field.fields.some(subField => subField.required === true),
        type: schema,
      },
    };
  },
  select: (field, fields) => {
    if (!field.options || field.options.length === 0) {
      throw new MissingSelectOptions(field);
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
  flexible: (field, fields) => {
    const flexibleSchema = new Schema({ blockName: String }, { discriminatorKey: 'blockType', _id: false, id: false });

    return {
      ...fields,
      [field.name]: {
        type: [flexibleSchema],
        localized: field.localized || false,
      },
    };
  },
};

module.exports = buildSchema;
