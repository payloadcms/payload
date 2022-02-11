/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-use-before-define */
import {
  GraphQLInputObjectType,
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
import withWhereAndOr from './withWhereAndOr';
import fieldToSchemaMap from './fieldToSchemaMap';

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

  const fieldTypes = fields.reduce((schema, field) => {
    if (!fieldIsPresentationalOnly(field) && !field.hidden) {
      const getFieldSchema = fieldToSchemaMap(parentName)[field.type];

      if (getFieldSchema) {
        const fieldSchema = getFieldSchema(field);

        if (fieldHasSubFields(field)) {
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

  return withWhereAndOr(fieldName, fieldTypes);
};

export default buildWhereInputType;
