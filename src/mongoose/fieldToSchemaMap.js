import mongoose from 'mongoose';

const formatBaseSchema = field => {
  const schema = {};

  if (field.localized === true) schema.intl = true;
  if (field.unique === true) schema.unique = true;
  if (field.default) schema.default = field.default;

  return schema;
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
