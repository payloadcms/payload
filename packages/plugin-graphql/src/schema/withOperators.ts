import type { GraphQLType } from 'graphql'
import type { FieldAffectingData, NumberField, RadioField, SelectField } from 'payload'

import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLString,
} from 'graphql'
import { DateTimeResolver, EmailAddressResolver } from 'graphql-scalars'
import { optionIsObject } from 'payload/shared'

import { GraphQLJSON } from '../packages/graphql-type-json/index.js'
import { combineParentName } from '../utilities/combineParentName.js'
import { formatName } from '../utilities/formatName.js'
import { operators } from './operators.js'

type staticTypes =
  | 'checkbox'
  | 'code'
  | 'date'
  | 'email'
  | 'json'
  | 'number'
  | 'point'
  | 'relationship'
  | 'richText'
  | 'text'
  | 'textarea'
  | 'upload'

type dynamicTypes = 'radio' | 'select'

const GeoJSONObject = new GraphQLInputObjectType({
  name: 'GeoJSONObject',
  fields: {
    type: { type: GraphQLString },
    coordinates: {
      type: GraphQLJSON,
    },
  },
})

type DefaultsType = {
  [key in dynamicTypes]: {
    operators: {
      name: string
      type: (field: FieldAffectingData, parentName: string) => GraphQLType
    }[]
  }
} & {
  [key in staticTypes]: {
    operators: {
      name: string
      type: ((field: FieldAffectingData, parentName: string) => GraphQLType) | GraphQLType
    }[]
  }
}

const defaults: DefaultsType = {
  checkbox: {
    operators: [
      ...operators.equality.map((operator) => ({
        name: operator,
        type: GraphQLBoolean,
      })),
    ],
  },
  code: {
    operators: [
      ...[...operators.equality, ...operators.partial].map((operator) => ({
        name: operator,
        type: GraphQLString,
      })),
    ],
  },
  date: {
    operators: [
      ...[...operators.equality, ...operators.comparison, 'like'].map((operator) => ({
        name: operator,
        type: DateTimeResolver,
      })),
    ],
  },
  email: {
    operators: [
      ...[...operators.equality, ...operators.partial, ...operators.contains].map((operator) => ({
        name: operator,
        type: EmailAddressResolver,
      })),
    ],
  },
  json: {
    operators: [
      ...[...operators.equality, ...operators.partial, ...operators.geojson].map((operator) => ({
        name: operator,
        type: GraphQLJSON,
      })),
    ],
  },
  number: {
    operators: [
      ...[...operators.equality, ...operators.comparison].map((operator) => ({
        name: operator,
        type: (field: NumberField): GraphQLType => {
          return field?.name === 'id' ? GraphQLInt : GraphQLFloat
        },
      })),
    ],
  },
  point: {
    operators: [
      ...[...operators.equality, ...operators.comparison, ...operators.geo].map((operator) => ({
        name: operator,
        type: new GraphQLList(GraphQLFloat),
      })),
      ...operators.geojson.map((operator) => ({
        name: operator,
        /**
         * @example:
         * within: {
         *  type: "Polygon",
         *  coordinates: [[
         *   [0.0, 0.0],
         *   [1.0, 1.0],
         *   [1.0, 0.0],
         *   [0.0, 0.0],
         *  ]],
         * }
         * @example
         * intersects: {
         *  type: "Point",
         *  coordinates: [ 0.5, 0.5 ]
         * }
         */
        type: GeoJSONObject,
      })),
    ],
  },
  radio: {
    operators: [
      ...[...operators.equality, ...operators.partial].map((operator) => ({
        name: operator,
        type: (field: RadioField, parentName): GraphQLType =>
          new GraphQLEnumType({
            name: `${combineParentName(parentName, field.name)}_Input`,
            values: field.options.reduce((values, option) => {
              if (optionIsObject(option)) {
                return {
                  ...values,
                  [formatName(option.value)]: {
                    value: option.value,
                  },
                }
              }

              return {
                ...values,
                [formatName(option)]: {
                  value: option,
                },
              }
            }, {}),
          }),
      })),
    ],
  },
  relationship: {
    operators: [
      ...[...operators.equality, ...operators.contains].map((operator) => ({
        name: operator,
        type: GraphQLJSON,
      })),
    ],
  },
  richText: {
    operators: [
      ...[...operators.equality, ...operators.partial].map((operator) => ({
        name: operator,
        type: GraphQLJSON,
      })),
    ],
  },
  select: {
    operators: [
      ...[...operators.equality, ...operators.contains].map((operator) => ({
        name: operator,
        type: (field: SelectField, parentName): GraphQLType =>
          new GraphQLEnumType({
            name: `${combineParentName(parentName, field.name)}_Input`,
            values: field.options.reduce((values, option) => {
              if (optionIsObject(option)) {
                return {
                  ...values,
                  [formatName(option.value)]: {
                    value: option.value,
                  },
                }
              }

              return {
                ...values,
                [formatName(option)]: {
                  value: option,
                },
              }
            }, {}),
          }),
      })),
    ],
  },
  text: {
    operators: [
      ...[...operators.equality, ...operators.partial, ...operators.contains].map((operator) => ({
        name: operator,
        type: GraphQLString,
      })),
    ],
  },
  textarea: {
    operators: [
      ...[...operators.equality, ...operators.partial].map((operator) => ({
        name: operator,
        type: GraphQLString,
      })),
    ],
  },
  upload: {
    operators: [
      ...[...operators.equality, ...operators.contains].map((operator) => ({
        name: operator,
        type: GraphQLJSON,
      })),
    ],
  },
  // array: n/a
  // group: n/a
  // row: n/a
  // collapsible: n/a
  // tabs: n/a
}

const listOperators = ['in', 'not_in', 'all']

const gqlTypeCache: Record<string, GraphQLType> = {}

/**
 * In GraphQL, you can use "where" as an argument to filter a collection. Example:
 * { Posts(where: { title: { equals: "Hello" } }) { text } }
 * This function defines the operators for a field's condition in the "where" argument of the collection (it thus gets called for every field).
 * For example, in the example above, it would control that
 * - "equals" is a valid operator for the "title" field
 * - the accepted type of the "equals" argument has to be a string.
 *
 * @param field the field for which their valid operators inside a "where" argument is being defined
 * @param parentName the name of the parent field (if any)
 * @returns all the operators (including their types) which can be used as a condition for a given field inside a where
 */
export const withOperators = (
  field: FieldAffectingData,
  parentName: string,
): GraphQLInputObjectType => {
  if (!defaults?.[field.type]) {
    throw new Error(`Error: ${field.type} has no defaults configured.`)
  }

  const name = `${combineParentName(parentName, field.name)}_operator`

  // Get the default operators for the field type which are hard-coded above
  const fieldOperators = [...defaults[field.type].operators]

  if (!('required' in field) || !field.required) {
    fieldOperators.push({
      name: 'exists',
      type: fieldOperators[0].type,
    })
  }

  return new GraphQLInputObjectType({
    name,
    fields: fieldOperators.reduce((objectTypeFields, operator) => {
      // Get the type of the operator. It can be either static, or dynamic (=> a function)
      let gqlType: GraphQLType =
        typeof operator.type === 'function' ? operator.type(field, parentName) : operator.type

      // GraphQL does not allow types with duplicate names, so we use this cache to avoid that.
      // Without this, select and radio fields would have the same name, and GraphQL would throw an error
      // This usually only happens if a custom type is returned from the operator.type function
      if (typeof operator.type === 'function' && 'name' in gqlType) {
        if (gqlTypeCache[gqlType.name]) {
          gqlType = gqlTypeCache[gqlType.name]
        } else {
          gqlTypeCache[gqlType.name] = gqlType
        }
      }

      if (listOperators.includes(operator.name)) {
        gqlType = new GraphQLList(gqlType)
      } else if (operator.name === 'exists') {
        gqlType = GraphQLBoolean
      }

      return {
        ...objectTypeFields,
        [operator.name]: {
          type: gqlType,
        },
      }
    }, {}),
  })
}
