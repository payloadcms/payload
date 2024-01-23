/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-use-before-define */
import { GraphQLInputObjectType, GraphQLList } from 'graphql'

import type { Payload } from '../..'
import type { Field, FieldAffectingData } from '../../fields/config/types'

import {
  fieldAffectsData,
  fieldHasSubFields,
  fieldIsPresentationalOnly,
} from '../../fields/config/types'
import formatName from '../utilities/formatName'
import fieldToSchemaMap from './fieldToWhereInputSchemaMap'
import { withOperators } from './withOperators'
import flattenFields from '../../utilities/flattenTopLevelFields'

type Args = {
  fields: Field[]
  name: string
  parentName: string
  payload: Payload
}

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
const buildWhereInputType = ({
  name,
  fields,
  parentName,
  payload,
}: Args): GraphQLInputObjectType => {
  // This is the function that builds nested paths for all
  // field types with nested paths.

  const idField = flattenFields(fields).find(
    (field) => fieldAffectsData(field) && field.name === 'id',
  )

  const fieldTypes = fields.reduce((schema, field) => {
    if (!fieldIsPresentationalOnly(field) && !field.hidden) {
      const getFieldSchema = fieldToSchemaMap({
        parentName,
        payload,
      })[field.type]

      if (getFieldSchema) {
        const fieldSchema = getFieldSchema(field)

        if (fieldHasSubFields(field) || field.type === 'tabs') {
          return {
            ...schema,
            ...fieldSchema.reduce(
              (subFields, subField) => ({
                ...subFields,
                [formatName(subField.key)]: subField.type,
              }),
              {},
            ),
          }
        }

        return {
          ...schema,
          [formatName(field.name)]: fieldSchema,
        }
      }
    }

    return schema
  }, {})

  if (!idField) {
    fieldTypes.id = {
      type: withOperators({ name: 'id', type: 'text' } as FieldAffectingData, parentName),
    }
  }

  const fieldName = formatName(name)

  const recursiveFields = {
    AND: {
      type: new GraphQLList(
        new GraphQLInputObjectType({
          name: `${fieldName}_where_and`,
          fields: () => ({
            ...fieldTypes,
            ...recursiveFields,
          }),
        }),
      ),
    },
    OR: {
      type: new GraphQLList(
        new GraphQLInputObjectType({
          name: `${fieldName}_where_or`,
          fields: () => ({
            ...fieldTypes,
            ...recursiveFields,
          }),
        }),
      ),
    },
  }

  return new GraphQLInputObjectType({
    name: `${fieldName}_where`,
    fields: {
      ...fieldTypes,
      ...recursiveFields,
    },
  })
}

export default buildWhereInputType
