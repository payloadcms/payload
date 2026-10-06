import type { GraphQLOutputType } from 'graphql'

import {
  getNamedType,
  GraphQLError,
  GraphQLNonNull,
  GraphQLScalarType,
  isLeafType,
  isListType,
  isNonNullType,
} from 'graphql'

/** Preserves scalar serialization for both ordinary values and locale maps. */
export function buildLocalizedOutputType({
  name,
  type,
  localeCodes,
}: {
  localeCodes: string[]
  name: string
  type: GraphQLOutputType
}): GraphQLOutputType {
  const localizedType = new GraphQLScalarType({
    name,
    serialize: (value: unknown) => {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        const entries = Object.entries(value)

        if (entries.every(([code]) => localeCodes.includes(code))) {
          return Object.fromEntries(
            entries.map(([code, localizedValue]) => [
              code,
              serializeFieldValue({ type, value: localizedValue }),
            ]),
          )
        }
      }

      return serializeFieldValue({ type, value })
    },
  })

  return isNonNullType(type) ? new GraphQLNonNull(localizedType) : localizedType
}

function serializeFieldValue({
  type,
  value,
}: {
  type: GraphQLOutputType
  value: unknown
}): unknown {
  if (isNonNullType(type)) {
    if (value === null || value === undefined) {
      throw new GraphQLError(`Invalid null localized value for ${String(type)}.`)
    }

    return serializeFieldValue({ type: type.ofType, value })
  }

  if (value === null || value === undefined) {
    return null
  }

  if (isListType(type)) {
    if (!Array.isArray(value)) {
      throw new GraphQLError(`Invalid localized list value for ${String(type)}.`)
    }

    return value.map((entry) => serializeFieldValue({ type: type.ofType, value: entry }))
  }

  const leafType = getNamedType(type)

  return isLeafType(leafType) ? leafType.serialize(value) : value
}
