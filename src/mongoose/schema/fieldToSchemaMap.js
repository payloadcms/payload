const { Schema } = require('mongoose');

const formatBaseSchema = (field) => {
  return {
    hide: field.hide || false,
    localized: field.localized || false,
    unique: field.unique || false,
    required: (field.required && !field.localized) || false,
    default: field.defaultValue || undefined,
  };
};

const fieldToSchemaMap = {
  number: (field) => {
    return { ...formatBaseSchema(field), type: Number };
  },
  text: (field) => {
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
  checkbox: (field) => {
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
      return {
        type: [schema],
        localized: field.localized,
      };
    }

    return schema;
  },
  repeater: (field) => {
    const schema = {};

    field.fields.forEach((subField) => {
      schema[subField.name] = fieldToSchemaMap[subField.type](subField);
    });
    return [schema];
  },
  group: (field) => {
    // Localization for groups not supported
    const schema = {};

    field.fields.forEach((subField) => {
      schema[subField.name] = fieldToSchemaMap[subField.type](subField);
    });
    return schema;
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
