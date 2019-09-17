import mongoose from 'mongoose';

const fieldToSchemaMap = {
  input: () => { String },
  textarea: () => { String },
  relationship: field => {
    const schema = {
      type: mongoose.Schema.Types.ObjectId,
      autopopulate: true,
    }
    schema.ref = field.relationTo;
    return [schema];
  },
  repeater: field => {
    return field.fields.map(subField => fieldToSchemaMap[subField.type](subField));
  }
}

export default fieldToSchemaMap;
