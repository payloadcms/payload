const {
  GraphQLString,
  GraphQLFloat,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLList,
  // GraphQLInterfaceType,
  GraphQLEnumType,
  GraphQLInputObjectType,
} = require('graphql');

const formatName = require('../utilities/formatName');
const combineParentName = require('../utilities/combineParentName');
const withOperators = require('./withOperators');

const getBuildWhereInputType = (graphQLContext) => {
  const buildWhereInputType = (name, fields, parentName) => {
    const fieldToSchemaMap = {
      number: (field) => {
        const type = GraphQLFloat;
        return {
          type: withOperators(
            field.name,
            type,
            parentName,
            ['equals', 'greater_than_equal', 'greater_than', 'less_than_equal', 'less_than', 'not_equals'],
          ),
        };
      },
      text: (field) => {
        const type = GraphQLString;
        return {
          type: withOperators(
            field.name,
            type,
            parentName,
            ['equals', 'like', 'not_equals'],
          ),
        };
      },
      email: (field) => {
        const type = GraphQLString;
        return {
          type: withOperators(
            field.name,
            type,
            parentName,
            ['equals', 'like', 'not_equals'],
          ),
        };
      },
      textarea: (field) => {
        const type = GraphQLString;
        return {
          type: withOperators(
            field.name,
            type,
            parentName,
            ['equals', 'like', 'not_equals'],
          ),
        };
      },
      WYSIWYG: (field) => {
        const type = GraphQLString;
        return {
          type: withOperators(
            field.name,
            type,
            parentName,
            ['equals', 'like', 'not_equals'],
          ),
        };
      },
      code: (field) => {
        const type = GraphQLString;
        return {
          type: withOperators(
            field.name,
            type,
            parentName,
            ['equals', 'like', 'not_equals'],
          ),
        };
      },
      date: (field) => {
        const type = GraphQLString;
        return {
          type: withOperators(
            field.name,
            type,
            parentName,
            ['equals', 'like', 'not_equals', 'greater_than_equal', 'greater_than', 'less_than_equal', 'less_than'],
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
        type: withOperators(
          field.name,
          GraphQLBoolean,
          parentName,
          ['equals', 'not_equals'],
        ),
      }),
      select: field => ({
        type: withOperators(
          field.name,
          new GraphQLEnumType({
            name: `${combineParentName(parentName, field.name)}_Input`,
            values: field.options.reduce((values, option) => {
              if (typeof option === 'object' && option.value) {
                return {
                  ...values,
                  [formatName(option.label)]: {
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
          }),
          parentName,
          ['in', 'not_in', 'all', 'equals', 'not_equals'],
        ),
      }),
    };

    const fieldTypes = fields.reduce((schema, field) => {
      const getFieldSchema = fieldToSchemaMap[field.type];

      if (getFieldSchema) {
        return {
          ...schema,
          [field.name]: getFieldSchema(field),
        };
      }

      return schema;
    }, {});

    fieldTypes.id = {
      type: withOperators(
        'id',
        GraphQLString,
        parentName,
        ['equals', 'not_equals'],
      ),
    };

    const fieldName = formatName(name);

    return new GraphQLInputObjectType({
      name: `${fieldName}_where`,
      fields: {
        ...fieldTypes,
        OR: {
          type: new GraphQLList(new GraphQLInputObjectType({
            name: `${fieldName}_where_or`,
            fields: {
              ...fieldTypes,
            },
          })),
        },
        AND: {
          type: new GraphQLList(new GraphQLInputObjectType({
            name: `${fieldName}_where_and`,
            fields: {
              ...fieldTypes,
            },
          })),
        },
        page: { type: GraphQLInt },
        limit: { type: GraphQLInt },
        sort: { type: GraphQLString },
      },
    });
  };

  return buildWhereInputType;
};

module.exports = getBuildWhereInputType;
