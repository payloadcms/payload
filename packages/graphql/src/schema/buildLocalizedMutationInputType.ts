import type { GraphQLInputType, ValueNode } from 'graphql'

import {
  coerceInputValue,
  GraphQLError,
  GraphQLNonNull,
  GraphQLScalarType,
  isNonNullType,
  Kind,
  valueFromAST,
} from 'graphql'

/** Accepts the ordinary field value or a map of locale codes to that same typed value. */
export function buildLocalizedMutationInputType({
  name,
  type,
  localeCodes,
}: {
  localeCodes: string[]
  name: string
  type: GraphQLInputType
}): GraphQLInputType {
  const localizedType = new GraphQLScalarType({
    name,
    description:
      'A field value or an object mapping locale codes to field values when locale is all.',
    parseLiteral: (node, variables) => {
      if (
        node.kind === Kind.OBJECT &&
        node.fields.every((field) => localeCodes.includes(field.name.value))
      ) {
        return Object.fromEntries(
          node.fields.map((field) => [
            field.name.value,
            parseFieldLiteral({ type, node: field.value, variables }),
          ]),
        )
      }

      return parseFieldLiteral({ type, node, variables })
    },
    parseValue: (value: unknown) => {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        const entries = Object.entries(value)

        if (entries.every(([code]) => localeCodes.includes(code))) {
          return Object.fromEntries(
            entries.map(([code, localizedValue]) => [code, coerceInputValue(localizedValue, type)]),
          )
        }
      }

      return coerceInputValue(value, type)
    },
    serialize: (value) => value,
  })

  return isNonNullType(type) ? new GraphQLNonNull(localizedType) : localizedType
}

function parseFieldLiteral({
  type,
  node,
  variables,
}: {
  node: ValueNode
  type: GraphQLInputType
  variables: null | Readonly<Record<string, unknown>> | undefined
}): unknown {
  const value = valueFromAST(node, type, variables)

  if (value === undefined) {
    throw new GraphQLError(`Invalid localized field value for ${String(type)}.`, { nodes: node })
  }

  return value
}
