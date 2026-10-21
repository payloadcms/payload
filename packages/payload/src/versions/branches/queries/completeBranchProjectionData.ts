import type { Block, Field } from '../../../fields/config/types.js'

/** Supply explicit clears because native document updates otherwise merge omitted values. */
export const completeBranchProjectionData = ({
  blocks = [],
  fields,
  locales,
  parentIsLocalized = false,
  previous = {},
  replacement,
}: {
  blocks?: Block[]
  fields: Field[]
  locales: readonly string[]
  parentIsLocalized?: boolean
  previous?: Record<string, unknown>
  replacement: Record<string, unknown>
}): Record<string, unknown> => {
  const result = { ...replacement }

  for (const field of fields) {
    if (field.type === 'ui' || field.type === 'join' || ('virtual' in field && field.virtual)) {
      continue
    }
    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        Object.assign(
          result,
          completeBranchProjectionData({
            blocks,
            fields: 'name' in tab && tab.name ? [{ ...tab, type: 'group' } as Field] : tab.fields,
            locales,
            parentIsLocalized,
            previous,
            replacement: result,
          }),
        )
      }
      continue
    }
    if (!('name' in field)) {
      if ('fields' in field) {
        Object.assign(
          result,
          completeBranchProjectionData({
            blocks,
            fields: field.fields,
            locales,
            parentIsLocalized,
            previous,
            replacement: result,
          }),
        )
      }
      continue
    }
    if (field.name === 'id') {
      continue
    }

    const completeValue = ({
      isLocalized,
      oldValue,
      value,
    }: {
      isLocalized: boolean
      oldValue: unknown
      value: unknown
    }): unknown => {
      if ('fields' in field && field.type !== 'array') {
        return completeBranchProjectionData({
          blocks,
          fields: field.fields,
          locales,
          parentIsLocalized: isLocalized,
          previous: record(oldValue),
          replacement: record(value),
        })
      }
      if (field.type === 'array' || field.type === 'blocks') {
        if (!Array.isArray(value)) {
          return []
        }
        const oldRows = new Map(
          (Array.isArray(oldValue) ? oldValue : []).map((row) => [row.id, row]),
        )

        return value.map((row) => {
          const rowFields =
            field.type === 'array'
              ? field.fields
              : field.blocks
                  .map((block) =>
                    typeof block === 'string' ? blocks.find(({ slug }) => slug === block) : block,
                  )
                  .find((block) => block?.slug === row.blockType)?.fields

          if (!rowFields) {
            throw new Error('Unknown block in branch projection replacement.')
          }

          return completeBranchProjectionData({
            blocks,
            fields: rowFields,
            locales,
            parentIsLocalized: isLocalized,
            previous: oldRows.get(row.id),
            replacement: row,
          })
        })
      }

      return value === undefined ? ('hasMany' in field && field.hasMany ? [] : null) : value
    }

    if ('localized' in field && field.localized && !parentIsLocalized) {
      result[field.name] = Object.fromEntries(
        locales.map((locale) => [
          locale,
          completeValue({
            isLocalized: true,
            oldValue: record(previous[field.name])[locale],
            value: record(replacement[field.name])[locale],
          }),
        ]),
      )
    } else {
      result[field.name] = completeValue({
        isLocalized: parentIsLocalized,
        oldValue: previous[field.name],
        value: replacement[field.name],
      })
    }
  }

  return result
}

const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
