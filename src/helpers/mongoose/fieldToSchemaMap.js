import mongoose from 'mongoose';

const formatBaseSchema = ({ localized, unique }) => {
  const schema = {};

  if (localized === true) schema.intl = true;
  if (unique === true) schema.unique = true;

  return schema;
}

const fieldToSchemaMap = {
  input: field => {
    const schema = formatBaseSchema(field);
    schema.type = String;
    return schema;
  },
  textarea: field => {
    const schema = formatBaseSchema(field);
    schema.type = String;

    return schema;
  },
  relationship: field => {
    const schema = formatBaseSchema(field);
    schema.type = mongoose.Schema.Types.ObjectId;
    schema.autopopulate = true;
    schema.ref = field.relationTo;
    return [schema];
  },
  repeater: field => {
    return field.fields.map(subField => fieldToSchemaMap[subField.type](subField));
  }
}

export default fieldToSchemaMap;
