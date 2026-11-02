import type { CollectionConfig, SelectType } from 'payload'

import { getSelectMode } from 'payload/shared'

type SelectRecord = Record<string, unknown>

const locationFieldNames = ['filename', 'prefix', '_objectKey'] as const

/**
 * URL hooks rebuild direct URLs from each representation's stored location, so a positive
 * selection of a URL must also read the fields that location is built from.
 */
export const getStorageLocationSelect =
  ({
    select: existingSelect,
  }: {
    select: CollectionConfig['select']
  }): NonNullable<CollectionConfig['select']> =>
  (args) => {
    const select = existingSelect?.(args) ?? args.select

    if (!select || getSelectMode(select) === 'exclude') {
      return select
    }

    return withLocationFields({ select })
  }

const withLocationFields = ({ select }: { select: SelectType }): SelectType => {
  const result = addLocationFields({ representation: { ...select } })

  if (isSelectRecord(result.original)) {
    result.original = addLocationFields({ representation: { ...result.original } })
  }

  if (isSelectRecord(result.variants)) {
    result.variants = Object.fromEntries(
      Object.entries(result.variants).map(([name, variant]) => [
        name,
        isSelectRecord(variant) ? addLocationFields({ representation: { ...variant } }) : variant,
      ]),
    )
  }

  return result as SelectType
}

const addLocationFields = ({ representation }: { representation: SelectRecord }): SelectRecord => {
  if (representation.url === true) {
    for (const fieldName of locationFieldNames) {
      representation[fieldName] = true
    }
  }

  return representation
}

const isSelectRecord = (value: unknown): value is SelectRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
