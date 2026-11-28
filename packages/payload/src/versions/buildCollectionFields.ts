import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'
import type { Field, FlattenedField } from '../fields/config/types.js'

import { hasAutosaveEnabled, hasDraftsEnabled } from '../utilities/getVersionsConfig.js'

// Cache the version schema per collection. It derives only from the (stable)
// collection config, so rebuilding a fresh array on every call is wasted work
// and — since `flattenAllFields` keys `flattenedFieldsCache` by array identity —
// leaks one cache entry per request. WeakMap so discarded configs are reclaimed;
// flattened/unflattened are cached separately (flatten changes the version group).
type VersionCollectionFieldsCacheEntry = {
  flattened?: FlattenedField[]
  unflattened?: Field[]
}

const versionCollectionFieldsCache = new WeakMap<
  SanitizedCollectionConfig,
  VersionCollectionFieldsCacheEntry
>()

export const buildVersionCollectionFields = <T extends boolean = false>(
  config: SanitizedConfig,
  collection: SanitizedCollectionConfig,
  flatten?: T,
): true extends T ? FlattenedField[] : Field[] => {
  let cacheEntry = versionCollectionFieldsCache.get(collection)
  if (!cacheEntry) {
    cacheEntry = {}
    versionCollectionFieldsCache.set(collection, cacheEntry)
  }

  const cached = flatten ? cacheEntry.flattened : cacheEntry.unflattened
  if (cached) {
    return cached as true extends T ? FlattenedField[] : Field[]
  }

  const fields: FlattenedField[] = [
    {
      name: 'parent',
      type: 'relationship',
      index: true,
      relationTo: collection.slug,
    },
    {
      name: 'version',
      type: 'group',
      fields: collection.fields.filter((field) => !('name' in field) || field.name !== 'id'),
      ...(flatten && {
        flattenedFields: collection.flattenedFields.filter((each) => each.name !== 'id'),
      })!,
    },
    {
      name: 'createdAt',
      type: 'date',
      admin: {
        disabled: true,
      },
      index: true,
    },
    {
      name: 'updatedAt',
      type: 'date',
      admin: {
        disabled: true,
      },
      index: true,
    },
  ]

  if (hasDraftsEnabled(collection)) {
    if (config.localization) {
      fields.push({
        name: 'publishedLocale',
        type: 'select',
        admin: {
          disabled: true,
        },
        index: true,
        options: config.localization.locales.map((locale) => {
          if (typeof locale === 'string') {
            return locale
          }

          return locale.code
        }),
      })
    }

    fields.push({
      name: 'latest',
      type: 'checkbox',
      admin: {
        disabled: true,
      },
      index: true,
    })

    if (hasAutosaveEnabled(collection)) {
      fields.push({
        name: 'autosave',
        type: 'checkbox',
        index: true,
      })
    }
  }

  if (flatten) {
    cacheEntry.flattened = fields
  } else {
    cacheEntry.unflattened = fields as Field[]
  }

  return fields as true extends T ? FlattenedField[] : Field[]
}
