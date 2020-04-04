const {
  GraphQLString,
  GraphQLFloat,
  GraphQLBoolean,
  GraphQLList,
  // GraphQLInterfaceType,
  // GraphQLEnumType,
  GraphQLInputObjectType,
} = require('graphql');

const formatName = require('../utilities/formatName');
// const combineParentName = require('./combineParentName');
const withTypeOperators = require('./withTypeOperators');

const buildWhereInputType = ({ name, fields, parent }) => {
  const fieldToSchemaMap = {
    number: (field) => {
      const type = GraphQLFloat;
      return {
        type: withTypeOperators(
          field,
          type,
          parent,
          ['equals', 'gte', 'gt', 'lte', 'lt', 'not_equals'],
        ),
      };
    },
    text: (field) => {
      const type = GraphQLString;
      return {
        type: withTypeOperators(
          field,
          type,
          parent,
          ['equals', 'like', 'not_equals'],
        ),
      };
    },
    email: (field) => {
      const type = GraphQLString;
      return {
        type: withTypeOperators(
          field,
          type,
          parent,
          ['equals', 'like', 'not_equals'],
        ),
      };
    },
    textarea: (field) => {
      const type = GraphQLString;
      return {
        type: withTypeOperators(
          field,
          type,
          parent,
          ['equals', 'like', 'not_equals'],
        ),
      };
    },
    WYSIWYG: (field) => {
      const type = GraphQLString;
      return {
        type: withTypeOperators(
          field,
          type,
          parent,
          ['equals', 'like', 'not_equals'],
        ),
      };
    },
    code: (field) => {
      const type = GraphQLString;
      return {
        type: withTypeOperators(
          field,
          type,
          parent,
          ['equals', 'like', 'not_equals'],
        ),
      };
    },
    date: (field) => {
      const type = GraphQLString;
      return {
        type: withTypeOperators(
          field,
          type,
          parent,
          ['equals', 'like', 'not_equals'],
        ),
      };
    },
    upload: () => {
      const type = GraphQLString;
      return {
        type,
      };
    },
    checkbox: field => ({
      type: withTypeOperators(
        field,
        GraphQLBoolean,
        parent,
        ['equals', 'not_equals'],
      ),
    }),
  };

  const fieldTypes = fields.reduce((schema, field) => {
    const getFieldSchema = fieldToSchemaMap[field.type];

    if (getFieldSchema) {
      return {
        ...schema,
        [formatName(field.label)]: getFieldSchema(field),
      };
    }

    return schema;
  }, {});

  // fieldTypes.id = {
  //   text: (field) => {
  //     const type = GraphQLString;
  //     return {
  //       type: withTypeOperators(
  //         field,
  //         type,
  //         parent,
  //         ['equals', 'not_equals'],
  //       ),
  //     };
  //   },
  // };

  const fieldName = formatName(name);

  return new GraphQLInputObjectType({
    name: `${fieldName}Where`,
    fields: {
      ...fieldTypes,
      OR: {
        type: new GraphQLList(new GraphQLInputObjectType({
          name: `${fieldName}WhereOr`,
          fields: {
            ...fieldTypes,
          },
        })),
      },
      AND: {
        type: new GraphQLList(new GraphQLInputObjectType({
          name: `${fieldName}WhereAnd`,
          fields: {
            ...fieldTypes,
          },
        })),
      },
    },
  });
};

module.exports = buildWhereInputType;
