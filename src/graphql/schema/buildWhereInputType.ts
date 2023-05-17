/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-use-before-define */
import {
  GraphQLInputObjectType, GraphQLList,
} from 'graphql';

import { GraphQLJSON } from 'graphql-type-json';

import {
  Field,
  FieldAffectingData,
  fieldHasSubFields,
  fieldIsPresentationalOnly,
} from '../../fields/config/types';
import formatName from '../utilities/formatName';
import withOperators from './withOperators';
import operators from './operators';
import fieldToSchemaMap from './fieldToWhereInputSchemaMap';

// buildWhereInputType is similar to buildObjectType and operates
// on a field basis with a few distinct differences.
//
// 1. Everything needs to be a GraphQLInputObjectType or scalar / enum
// 2. Relationships, groups, repeaters and flex content are not
//    directly searchable. Instead, we need to build a chained pathname
//    using dot notation so MongoDB can properly search nested paths.
const buildWhereInputType = (name: string, fields: Field[], parentName: string): GraphQLInputObjectType => {
  // This is the function that builds nested paths for all
  // field types with nested paths.

  const fieldTypes = fields.reduce((schema, field) => {
    if (!fieldIsPresentationalOnly(field) && !field.hidden) {
      const getFieldSchema = fieldToSchemaMap(parentName)[field.type];

      if (getFieldSchema) {
        const fieldSchema = getFieldSchema(field);

        if (fieldHasSubFields(field) || field.type === 'tabs') {
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
      { name: 'id' } as FieldAffectingData,
      GraphQLJSON,
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
          fields: fieldTypes,
        })),
      },
      AND: {
        type: new GraphQLList(new GraphQLInputObjectType({
          name: `${fieldName}_where_and`,
          fields: fieldTypes,
        })),
      },
    },
  });
};

export default buildWhereInputType;
