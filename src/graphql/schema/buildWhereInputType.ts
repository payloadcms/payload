/* eslint-disable no-use-before-define */
import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLString,
} from 'graphql';

import { GraphQLJSON } from 'graphql-type-json';

import { DateTimeResolver, EmailAddressResolver } from 'graphql-scalars';
import {
  optionIsObject,
  ArrayField,
  CheckboxField,
  CodeField,
  DateField,
  EmailField,
  Field,
  FieldWithSubFields,
  GroupField,
  NumberField,
  RadioField,
  RelationshipField,
  RichTextField,
  RowField,
  SelectField,
  TextareaField,
  TextField,
  UploadField,
  PointField,
} from '../../fields/config/types';
import formatName from '../utilities/formatName';
import combineParentName from '../utilities/combineParentName';
import withOperators from './withOperators';

// buildWhereInputType is similar to buildObjectType and operates
// on a field basis with a few distinct differences.
//
// 1. Everything needs to be a GraphQLInputObjectType or scalar / enum
// 2. Relationships, groups, repeaters and flex content are not
//    directly searchable. Instead, we need to build a chained pathname
//    using dot notation so Mongo can properly search nested paths.
const buildWhereInputType = (name: string, fields: Field[], parentName: string): GraphQLInputObjectType => {
  // This is the function that builds nested paths for all
  // field types with nested paths.
  const recursivelyBuildNestedPaths = (field: FieldWithSubFields) => {
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

  const operators = {
    equality: ['equals', 'not_equals'],
    contains: ['in', 'not_in', 'all'],
    comparison: ['greater_than_equal', 'greater_than', 'less_than_equal', 'less_than'],
  };

  const fieldToSchemaMap = {
    number: (field: NumberField) => {
      const type = GraphQLFloat;
      return {
        type: withOperators(
          field,
          type,
          parentName,
          [...operators.equality, ...operators.comparison],
        ),
      };
    },
    text: (field: TextField) => {
      const type = GraphQLString;
      return {
        type: withOperators(
          field,
          type,
          parentName,
          [...operators.equality, 'like'],
        ),
      };
    },
    email: (field: EmailField) => {
      const type = EmailAddressResolver;
      return {
        type: withOperators(
          field,
          type,
          parentName,
          [...operators.equality, 'like'],
        ),
      };
    },
    textarea: (field: TextareaField) => {
      const type = GraphQLString;
      return {
        type: withOperators(
          field,
          type,
          parentName,
          [...operators.equality, 'like'],
        ),
      };
    },
    richText: (field: RichTextField) => {
      const type = GraphQLJSON;
      return {
        type: withOperators(
          field,
          type,
          parentName,
          [...operators.equality, 'like'],
        ),
      };
    },
    code: (field: CodeField) => {
      const type = GraphQLString;
      return {
        type: withOperators(
          field,
          type,
          parentName,
          [...operators.equality, 'like'],
        ),
      };
    },
    radio: (field: RadioField) => ({
      type: withOperators(
        field,
        new GraphQLEnumType({
          name: `${combineParentName(parentName, field.name)}_Input`,
          values: field.options.reduce((values, option) => {
            if (optionIsObject(option)) {
              return {
                ...values,
                [formatName(option.value)]: {
                  value: option.value,
                },
              };
            }

            return {
              ...values,
              [formatName(option)]: {
                value: option,
              },
            };
          }, {}),
        }),
        parentName,
        [...operators.equality, 'like'],
      ),
    }),
    date: (field: DateField) => {
      const type = DateTimeResolver;
      return {
        type: withOperators(
          field,
          type,
          parentName,
          [...operators.equality, ...operators.comparison, 'like'],
        ),
      };
    },
    point: (field: PointField) => {
      const type = GraphQLList(GraphQLFloat);
      return {
        type: withOperators(
          field,
          type,
          parentName,
          [...operators.equality, ...operators.comparison, 'near'],
        ),
      };
    },
    relationship: (field: RelationshipField) => {
      let type = withOperators(
        field,
        GraphQLString,
        parentName,
        [...operators.equality, ...operators.contains],
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
    upload: (field: UploadField) => ({
      type: withOperators(
        field,
        GraphQLString,
        parentName,
        [...operators.equality],
      ),
    }),
    checkbox: (field: CheckboxField) => ({
      type: withOperators(
        field,
        GraphQLBoolean,
        parentName,
        [...operators.equality],
      ),
    }),
    select: (field: SelectField) => ({
      type: withOperators(
        field,
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
        [...operators.equality, ...operators.contains],
      ),
    }),
    array: (field: ArrayField) => recursivelyBuildNestedPaths(field),
    group: (field: GroupField) => recursivelyBuildNestedPaths(field),
    row: (field: RowField) => field.fields.reduce((rowSchema, rowField) => {
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
    if (!field.hidden) {
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
    }

    return schema;
  }, {});

  fieldTypes.id = {
    type: withOperators(
      { name: 'id' } as Field,
      GraphQLString,
      parentName,
      [...operators.equality, ...operators.contains],
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

export default buildWhereInputType;
