/* eslint-disable no-use-before-define */
const {
  GraphQLString,
  GraphQLNonNull,
  GraphQLFloat,
  GraphQLBoolean,
  GraphQLList,
  GraphQLEnumType,
  GraphQLInputObjectType,
} = require('graphql');

const withNullableType = require('./withNullableType');
const formatName = require('../utilities/formatName');
const combineParentName = require('../utilities/combineParentName');

function buildMutationInputType(name, fields, parentName) {
  const fieldToSchemaMap = {
    number: field => ({ type: withNullableType(field, GraphQLFloat) }),
    text: field => ({ type: withNullableType(field, GraphQLString) }),
    email: field => ({ type: withNullableType(field, GraphQLString) }),
    textarea: field => ({ type: withNullableType(field, GraphQLString) }),
    wysiwyg: field => ({ type: withNullableType(field, GraphQLString) }),
    code: field => ({ type: withNullableType(field, GraphQLString) }),
    date: field => ({ type: withNullableType(field, GraphQLString) }),
    upload: field => ({ type: withNullableType(field, GraphQLString) }),
    checkbox: () => ({ type: GraphQLBoolean }),
    select: (field) => {
      let type = new GraphQLEnumType({
        name: `${combineParentName(parentName, field.name)}_Input`,
        values: field.options.reduce((values, option) => {
          if (typeof option === 'object' && option.value) {
            return {
              ...values,
              [formatName(option.value)]: {
                value: option.value,
              },
            };
          }

          if (typeof option === 'string') {
            return {
              ...values,
              [option]: {
                value: option,
              },
            };
          }

          return values;
        }, {}),
      });

      type = field.hasMany ? new GraphQLList(type) : type;
      type = withNullableType(field, type);

      return { type };
    },
    repeater: (field) => {
      const fullName = combineParentName(parentName, field.label);
      let type = buildMutationInputType(fullName, field.fields, fullName);
      type = new GraphQLList(withNullableType(field, type));
      return { type };
    },
    group: (field) => {
      const requiresAtLeastOneField = field.fields.some(subField => (subField.required && !subField.localized));
      const fullName = combineParentName(parentName, field.label);
      let type = buildMutationInputType(fullName, field.fields, fullName);
      if (requiresAtLeastOneField) type = new GraphQLNonNull(type);
      return { type };
    },
    flexible: (field) => {
      const blockInputType = this.buildBlockInputType(field.name, field.blocks, parentName);
      return { type: new GraphQLList(blockInputType) };
    },
  };

  const fieldTypes = fields.reduce((schema, field) => {
    const getFieldSchema = fieldToSchemaMap[field.type];

    if (getFieldSchema) {
      const fieldSchema = getFieldSchema(field);

      return {
        ...schema,
        [field.name]: fieldSchema,
      };
    }

    return schema;
  }, {});

  const fieldName = formatName(name);

  return new GraphQLInputObjectType({
    name: `create${fieldName}Input`,
    fields: {
      ...fieldTypes,
    },
  });
}

module.exports = buildMutationInputType;
