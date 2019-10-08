import mongoose from 'mongoose';

const formatBaseSchema = field => {
  return {
    localized: field.localized || false,
    unique: field.unique || false,
    default: field.default || undefined,
  };
};

const fieldToSchemaMap = {
  input: field => {
    const schema = formatBaseSchema(field);
    schema.type = String;
    return schema;
  },
  textarea: field => {
    return {
      ...formatBaseSchema(field),
      type: String,
    };
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
    return field.fields.map(subField => fieldToSchemaMap[subField.type](subField));
  },
  enum: field => {
    return {...formatBaseSchema(field),
      type: String,
      enum: field.enum,
    };
  }
};

export default fieldToSchemaMap;
