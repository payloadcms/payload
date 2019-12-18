import mongoose from 'mongoose';
import localizationPlugin from '../../localization/localization.plugin';
import autopopulate from '../autopopulate.plugin';

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
  WYSIWYG: field => {
    return { ...formatBaseSchema(field), type: String };
  },
  code: field => {
    return { ...formatBaseSchema(field), type: String };
  },
  boolean: field => {
    return { ...formatBaseSchema(field), type: Boolean };
  },
  date: field => {
    return {
      ...formatBaseSchema(field),
      type: Date
    }
  },
  relationship: field => {
    const schema = {
      ...formatBaseSchema(field),
      type: mongoose.Schema.Types.ObjectId,
      autopopulate: true,
      ref: field.relationTo,
    };
    return field.hasMany ? [schema] : schema;
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
  flexible: (field, options = {}) => {
    const flexible = {
      value: {
        type: mongoose.Types.ObjectId,
        autopopulate: true,
        refPath: `${options.path ? (options.path + '.') : ''}${field.name}.blockType`,
      },
      blockType: { type: String, enum: field.blocks },
      _id: false,
    };

    const schema = new mongoose.Schema(
      field.hasMany !== false ? [flexible] : flexible,
      {
        hasMany: field.hasMany,
        localized: field.localized || false,
      }
    );

    if (field.localized) {
      schema.plugin(localizationPlugin, options.localization);
    }
    schema.plugin(autopopulate);

    return schema;
  },
};

export default fieldToSchemaMap;
