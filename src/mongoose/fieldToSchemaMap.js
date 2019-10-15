import mongoose from 'mongoose';

const formatBaseSchema = field => {
  return {
    localized: field.localized || false,
    unique: field.unique || false,
    default: field.default || undefined,
  };
};

const fieldToSchemaMap = {
  number: field => {
    return {...formatBaseSchema(field), type: Number};
  },
  input: field => {
    return {...formatBaseSchema(field), type: String};
  },
  textarea: field => {
    return {...formatBaseSchema(field), type: String};
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
    return {...formatBaseSchema(field),
      type: String,
      enum: field.enum,
    };
  },
};

export default fieldToSchemaMap;
