import type { FlattenedField, JsonObject } from 'payload'

import { fieldIsVirtual } from 'payload/shared'

/** Clear omitted stored fields: the ordinary Drizzle writer otherwise treats them as a patch. */
export const completeBranchVersionData = ({
  fields,
  previous,
  replacement,
}: {
  fields: FlattenedField[]
  previous: JsonObject
  replacement: JsonObject
}): JsonObject => {
  const result: JsonObject = { ...replacement }

  for (const field of fields) {
    if (fieldIsVirtual(field) || field.type === 'join') {
      continue
    }

    const previousValue = previous?.[field.name]
    const replacementValue = replacement?.[field.name]
    const completeValue = ({
      previousValue,
      replacementValue,
    }: {
      previousValue: unknown
      replacementValue: unknown
    }) => {
      if (field.type === 'group' || field.type === 'tab') {
        return completeBranchVersionData({
          fields: field.flattenedFields,
          previous: (previousValue && typeof previousValue === 'object'
            ? previousValue
            : {}) as JsonObject,
          replacement: (replacementValue && typeof replacementValue === 'object'
            ? replacementValue
            : {}) as JsonObject,
        })
      }

      if (replacementValue !== undefined) {
        return replacementValue
      }

      return field.type === 'array' ||
        field.type === 'blocks' ||
        ('hasMany' in field && field.hasMany)
        ? []
        : null
    }

    if (field.localized) {
      const previousLocales =
        previousValue && typeof previousValue === 'object' ? previousValue : {}
      const replacementLocales =
        replacementValue && typeof replacementValue === 'object' ? replacementValue : {}
      const locales = new Set([...Object.keys(previousLocales), ...Object.keys(replacementLocales)])

      result[field.name] = Object.fromEntries(
        [...locales].map((locale) => [
          locale,
          completeValue({
            previousValue: previousLocales[locale],
            replacementValue: replacementLocales[locale],
          }),
        ]),
      )
    } else {
      result[field.name] = completeValue({ previousValue, replacementValue })
    }
  }

  return result
}
