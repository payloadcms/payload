import type { Field, FieldAffectingData } from 'payload'

import { GraphQLInputObjectType, GraphQLList } from 'graphql'
import { flattenTopLevelFields } from 'payload'
import { fieldAffectsData, fieldHasSubFields, fieldIsPresentationalOnly } from 'payload/shared'

import { formatName } from '../utilities/formatName.js'
import { fieldToSchemaMap } from './fieldToWhereInputSchemaMap.js'
import { withOperators } from './withOperators.js'

type Args = {
  fields: Field[]
  name: string
  parentName: string
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
export const buildWhereInputType = ({ name, fields, parentName }: Args): GraphQLInputObjectType => {
  // This is the function that builds nested paths for all
  // field types with nested paths.

  const idField = flattenTopLevelFields(fields).find(
    (field) => fieldAffectsData(field) && field.name === 'id',
  )

  const fieldTypes = fields.reduce((schema, field) => {
    if (!fieldIsPresentationalOnly(field) && !field.hidden) {
      const getFieldSchema = fieldToSchemaMap({
        parentName,
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
