import type { GraphQLEnumValueConfigMap } from 'graphql'
import type { RadioField, SelectField } from 'payload'

import { formatName } from './formatName.js'

/**
 * Convert an arbitrary string into a valid GraphQL enum *name* (token).
 * Keeps formatName’s backwards-compat behavior, then enforces GraphQL rules.
 */
const sanitizeEnumName = (value: string) => {
  let key = formatName(value)
    .replace(/\W/g, '_') // non-word chars → underscore
    .replace(/_+/g, '_') // collapse repeated underscores
    .replace(/^_+|_+$/g, '') // trim leading/trailing underscores

  // GraphQL names must start with a letter or underscore
  if (!/^[A-Z_]/i.test(key)) {
    key = `_${key}`
  }

  return key || '_'
}

/**
 * Build a GraphQL enum value map from select/radio options.
 * - Keys: safe GraphQL enum names
 * - Values: original option values (string/number/boolean)
 * - Deterministically disambiguates collisions by suffixing _2, _3, ...
 */

export const formatOptions = (field: RadioField | SelectField): GraphQLEnumValueConfigMap => {
  const enumValueMap: GraphQLEnumValueConfigMap = {}
  const nameCounts = new Map<string, number>()

  const optionsArray = Array.isArray(field.options) ? field.options : []

  for (const option of optionsArray) {
    const rawValue = typeof option === 'object' ? String(option.value) : String(option)

    let enumName = sanitizeEnumName(rawValue)

    // De-duplicate if multiple raw values sanitize to the same enum name
    const nextCount = (nameCounts.get(enumName) ?? 0) + 1

    nameCounts.set(enumName, nextCount)
    if (nextCount > 1) {
      enumName = `${enumName}_${nextCount}`
    }

    enumValueMap[enumName] = {
      value: typeof option === 'object' ? option.value : option,
    }
  }

  return enumValueMap
}
