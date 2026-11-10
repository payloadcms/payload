import type { CollectionConfig, SelectType } from 'payload'

import { getSelectMode } from 'payload/shared'

type SelectRecord = Record<string, unknown>

// `_stored` tells a URL hook that an entry has no object, so its URL keeps the Payload route.
const locationFieldNames = ['filename', 'prefix', '_objectKey', '_stored'] as const

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
    const original = addLocationFields({ representation: { ...result.original } })
    result.original = original

    // The original URL compares the original's location with the main file's location.
    if (original.url === true) {
      result.filename = true
      result._objectKey = true
      result._stored = true
    }
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
