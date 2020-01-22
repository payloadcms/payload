const { Schema } = require('mongoose');

const formatBaseSchema = (field) => {
  return {
    hide: field.hide || false,
    localized: field.localized || false,
    unique: field.unique || false,
    required: field.required || false,
    default: field.defaultValue || undefined,
  };
};

const fieldToSchemaMap = {
  number: (field) => {
    return { ...formatBaseSchema(field), type: Number };
  },
  input: (field) => {
    return { ...formatBaseSchema(field), type: String };
  },
  textarea: (field) => {
    return { ...formatBaseSchema(field), type: String };
  },
  WYSIWYG: (field) => {
    return { ...formatBaseSchema(field), type: String };
  },
  code: (field) => {
    return { ...formatBaseSchema(field), type: String };
  },
  boolean: (field) => {
    return { ...formatBaseSchema(field), type: Boolean };
  },
  date: (field) => {
    return {
      ...formatBaseSchema(field),
      type: Date,
    };
  },
  upload: (field, config) => {
    const schema = {
      ...formatBaseSchema(field),
      type: Schema.Types.ObjectId,
      autopopulate: true,
      ref: config.upload.labels.singular,
    };
    return schema;
  },
  relationship: (field) => {
    const schema = {
      ...formatBaseSchema(field),
      type: Schema.Types.ObjectId,
      autopopulate: true,
      ref: field.relationTo,
    };
    return field.hasMany ? [schema] : schema;
  },
  repeater: (field) => {
    const schema = {};

    field.fields.forEach((subField) => {
      schema[subField.name] = fieldToSchemaMap[subField.type](subField);
    });
    return [schema];
  },
  select: (field) => {
    const schema = {
      ...formatBaseSchema(field),
      type: String,
      enum: field.options.map((option) => {
        if (typeof option === 'object') return option.value;
        return option;
      }),
    };

    return field.hasMany ? [schema] : schema;
  },
  flexible: (field) => {
    const flexibleSchema = new Schema({ blockName: String }, { discriminatorKey: 'blockType', _id: false });

    return {
      type: [flexibleSchema],
      localized: field.localized || false,
    };
  },
};

module.exports = fieldToSchemaMap;
