import mongoose from 'mongoose';

const formatBaseSchema = field => {
  return {
    localized: field.localized || false,
    unique: field.unique || false,
    default: field.default || undefined,
    hidden: field.hidden || false
  };
};

const fieldToSchemaMap = {
  number: field => {
    return { ...formatBaseSchema(field), type: Number };
  },
  input: field => {
    return { ...formatBaseSchema(field), type: String };
  },
  textarea: field => {
    return { ...formatBaseSchema(field), type: String };
  },
  date: field => {
    return {
      ...formatBaseSchema(field),
      type: Date
    }
  },
  relationship: field => {
    return [{
      ...formatBaseSchema(field),
      type: mongoose.Schema.Types.ObjectId,
      autopopulate: true,
      ref: field.relationTo,
    }];
  },
  repeater: field => {
    const schema = {};
    if (field.id === false) {
      schema._id = false;
    }
    field.fields.forEach(subField => {
      schema[subField.name] = fieldToSchemaMap[subField.type](subField);
    });
    return [schema];
  },
  enum: field => {
    return {
      ...formatBaseSchema(field),
      type: String,
      enum: field.enum,
    };
  },
  flexible: (field, path) => {
    return [{
      value: {
        type: mongoose.Types.ObjectId,
        autopopulate: true,
        refPath: `${path ? (path + '.') : ''}${field.name}.blockType`,
      },
      blockType: { type: String, enum: field.blocks },
      _id: false,
    }];
  },
};

export default fieldToSchemaMap;
