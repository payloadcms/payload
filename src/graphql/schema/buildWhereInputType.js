/* eslint-disable no-use-before-define */
const {
  GraphQLString,
  GraphQLFloat,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLList,
  GraphQLEnumType,
  GraphQLInputObjectType,
} = require('graphql');
const { GraphQLJSON } = require('graphql-type-json');

const formatName = require('../utilities/formatName');
const combineParentName = require('../utilities/combineParentName');
const withOperators = require('./withOperators');

// buildWhereInputType is similar to buildObjectType and operates
// on a field basis with a few distinct differences.
//
// 1. Everything needs to be a GraphQLInputObjectType or scalar / enum
// 2. Relationships, groups, repeaters and flex content are not
//    directly searchable. Instead, we need to build a chained pathname
//    using dot notation so Mongo can properly search nested paths.
const buildWhereInputType = (name, fields, parentName) => {
  // This is the function that builds nested paths for all
  // field types with nested paths.
  const recursivelyBuildNestedPaths = (field) => {
    const nestedPaths = field.fields.reduce((nestedFields, nestedField) => {
      const getFieldSchema = fieldToSchemaMap[nestedField.type];
      const nestedFieldName = `${field.name}__${nestedField.name}`;

      if (getFieldSchema) {
        const fieldSchema = getFieldSchema({
          ...nestedField,
          name: nestedFieldName,
        });

        if (Array.isArray(fieldSchema)) {
          return [
            ...nestedFields,
            ...fieldSchema,
          ];
        }

        return [
          ...nestedFields,
          {
            key: nestedFieldName,
            type: fieldSchema,
          },
        ];
      }

      return nestedFields;
    }, []);

    return nestedPaths;
  };

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
    richText: (field) => {
      const type = GraphQLJSON;
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
    radio: (field) => ({
      type: withOperators(
        field.name,
        new GraphQLEnumType({
          name: `${combineParentName(parentName, field.name)}_Input`,
          values: field.options.reduce((values, option) => ({
            ...values,
            [formatName(option.value)]: {
              value: option.value,
            },
          }), {}),
        }),
        parentName,
        ['like', 'equals', 'not_equals'],
      ),
    }),
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
    relationship: (field) => {
      let type = withOperators(
        field.name,
        GraphQLString,
        parentName,
        ['in', 'not_in', 'all', 'equals', 'not_equals'],
      );

      if (Array.isArray(field.relationTo)) {
        type = new GraphQLInputObjectType({
          name: `${combineParentName(parentName, field.name)}_Relation`,
          fields: {
            relationTo: {
              type: new GraphQLEnumType({
                name: `${combineParentName(parentName, field.name)}_Relation_RelationTo`,
                values: field.relationTo.reduce((values, relation) => ({
                  ...values,
                  [formatName(relation)]: {
                    value: relation,
                  },
                }), {}),
              }),
            },
            value: { type: GraphQLString },
          },
        });
      }

      if (field.hasMany) {
        return {
          type: new GraphQLList(type),
        };
      }

      return { type };
    },
    upload: (field) => ({
      type: withOperators(
        field.name,
        GraphQLString,
        parentName,
        ['equals', 'not_equals'],
      ),
    }),
    checkbox: (field) => ({
      type: withOperators(
        field.name,
        GraphQLBoolean,
        parentName,
        ['equals', 'not_equals'],
      ),
    }),
    select: (field) => ({
      type: withOperators(
        field.name,
        new GraphQLEnumType({
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
        }),
        parentName,
        ['in', 'not_in', 'all', 'equals', 'not_equals'],
      ),
    }),
    array: (field) => recursivelyBuildNestedPaths(field),
    group: (field) => recursivelyBuildNestedPaths(field),
    row: (field) => field.fields.reduce((rowSchema, rowField) => {
      const getFieldSchema = fieldToSchemaMap[rowField.type];

      if (getFieldSchema) {
        const rowFieldSchema = getFieldSchema(rowField);

        if (Array.isArray(rowFieldSchema)) {
          return [
            ...rowSchema,
            ...rowFieldSchema,
          ];
        }

        return [
          ...rowSchema,
          {
            key: rowField.name,
            type: rowFieldSchema,
          },
        ];
      }

      return rowSchema;
    }, []),
  };

  const fieldTypes = fields.reduce((schema, field) => {
    const getFieldSchema = fieldToSchemaMap[field.type];

    if (getFieldSchema) {
      const fieldSchema = getFieldSchema(field);

      if (Array.isArray(fieldSchema)) {
        return {
          ...schema,
          ...(fieldSchema.reduce((subFields, subField) => ({
            ...subFields,
            [formatName(subField.key)]: subField.type,
          }), {})),
        };
      }

      return {
        ...schema,
        [formatName(field.name)]: fieldSchema,
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

module.exports = buildWhereInputType;
