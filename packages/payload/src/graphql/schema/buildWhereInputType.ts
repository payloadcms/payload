/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-use-before-define */
import {
  GraphQLInputObjectType, GraphQLList,
} from 'graphql';

import type {
  Field,
  FieldAffectingData} from '../../fields/config/types';

import {
  fieldAffectsData,
  fieldHasSubFields,
  fieldIsPresentationalOnly,
} from '../../fields/config/types';
import formatName from '../utilities/formatName';
import fieldToSchemaMap from './fieldToWhereInputSchemaMap';
import { withOperators } from './withOperators';

/** This does as the function name suggests. It builds a where GraphQL input type
 * for all the fields which are passed to the function.
 * Each field has different operators which may be valid for a where input type.
 * For example, a text field may have a "contains" operator, but a number field
 * may not.
 *
 * buildWhereInputType is similar to buildObjectType and operates
 * on a field basis with a few distinct differences.
 *
 * 1. Everything needs to be a GraphQLInputObjectType or scalar / enum
 * 2. Relationships, groups, repeaters and flex content are not
 *    directly searchable. Instead, we need to build a chained pathname
 *    using dot notation so MongoDB can properly search nested paths.
 */
const buildWhereInputType = (name: string, fields: Field[], parentName: string): GraphQLInputObjectType => {
  // This is the function that builds nested paths for all
  // field types with nested paths.

  let idField: FieldAffectingData | undefined;

  const fieldTypes = fields.reduce((schema, field) => {
    if (fieldAffectsData(field) && field.name === 'id') idField = field;

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

  if (!idField) {
    fieldTypes.id = {
      type: withOperators(
        { name: 'id', type: 'text' } as FieldAffectingData,
        parentName,
      ),
    };
  }

  const fieldName = formatName(name);

  return new GraphQLInputObjectType({
    fields: {
      ...fieldTypes,
      AND: {
        type: new GraphQLList(new GraphQLInputObjectType({
          fields: fieldTypes,
          name: `${fieldName}_where_and`,
        })),
      },
      OR: {
        type: new GraphQLList(new GraphQLInputObjectType({
          fields: fieldTypes,
          name: `${fieldName}_where_or`,
        })),
      },
    },
    name: `${fieldName}_where`,
  });
};

export default buildWhereInputType;
