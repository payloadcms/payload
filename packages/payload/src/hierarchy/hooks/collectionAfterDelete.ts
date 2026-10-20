/**
 * afterDelete Hook Responsibilities:
 * - Clear hierarchy references from related documents when a hierarchy item is deleted
 * - For multi-value (hasMany) fields (e.g. tags), remove only the deleted id
 *   from the list instead of clearing the whole field
 */

import type { CollectionAfterDeleteHook } from '../../index.js'
import type { PayloadRequest } from '../../index.js'

import { extractID } from '../../utilities/extractID.js'

type RelatedCollectionConfig = {
  fieldName: string
  hasMany: boolean
}

type Args = {
  /**
   * Map of collection slugs to their hierarchy field name and hasMany status
   */
  relatedCollections: Record<string, RelatedCollectionConfig>
}

/**
 * Removes the deleted id from a relationship field value, keeping every other
 * value untouched. Handles plain arrays and localized objects of arrays.
 */
const removeIDFromValue = (value: unknown, id: string | number): unknown => {
  const target = String(id)

  const filterArray = (arr: unknown[]): unknown[] =>
    arr.filter(
      (item) => String(extractID(item as { id: string | number } | string | number)) !== target,
    )

  if (Array.isArray(value)) {
    return filterArray(value)
  }

  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {}
    for (const [locale, localeValue] of Object.entries(value)) {
      result[locale] = Array.isArray(localeValue) ? filterArray(localeValue) : localeValue
    }
    return result
  }

  return value
}

/**
 * Locales the hook must sweep for the given field. A localized relationship
 * field can hold the deleted id in any locale, so every configured locale is
 * visited for such fields. Returns undefined for non-localized fields (and
 * when localization is disabled), meaning a single pass with no locale
 * override.
 *
 * Note: `locale: 'all'` is deliberately not used here. The database adapters
 * resolve it to the default locale for query paths, so it would not match ids
 * stored in other locales.
 */
const getFieldLocales = (
  req: PayloadRequest,
  collectionSlug: string,
  fieldName: string,
): string[] | undefined => {
  const localization = req.payload.config?.localization
  if (!localization || !localization.localeCodes?.length) {
    return undefined
  }
  const { localeCodes } = localization
  const fields = req.payload.collections?.[collectionSlug]?.config?.fields
  const field = Array.isArray(fields)
    ? fields.find((candidate) => !!candidate && 'name' in candidate && candidate.name === fieldName)
    : undefined
  return field && 'localized' in field && field.localized === true ? localeCodes : undefined
}

export const hierarchyCollectionAfterDelete =
  ({ relatedCollections }: Args): CollectionAfterDeleteHook =>
  async ({ id, req }) => {
    for (const [collectionSlug, { fieldName, hasMany }] of Object.entries(relatedCollections)) {
      const locales = getFieldLocales(req, collectionSlug, fieldName)

      // Run once per locale for localized fields, once without a locale
      // override otherwise.
      const forEachLocale = async (fn: (locale?: string) => Promise<void>): Promise<void> => {
        if (locales) {
          for (const locale of locales) {
            await fn(locale)
          }
        } else {
          await fn(undefined)
        }
      }

      if (!hasMany) {
        // Single-value field (e.g. a folder reference): clear it entirely
        await forEachLocale(async (locale) => {
          await req.payload.update({
            collection: collectionSlug,
            data: {
              [fieldName]: null,
            },
            ...(locale ? { locale } : {}),
            overrideAccess: true,
            req,
            where: {
              [fieldName]: {
                equals: id,
              },
            },
          })
        })
        continue
      }

      // Multi-value field (e.g. tags): remove only the deleted id, keeping the
      // remaining values. Collect every match before updating, because each
      // update shrinks the find result set and would skew pagination.
      const docsToUpdate: Array<{ docID: number | string; locale?: string; value: unknown }> = []

      await forEachLocale(async (locale) => {
        let page = 1
        const limit = 100

        for (;;) {
          const { docs, hasNextPage } = await req.payload.find({
            collection: collectionSlug,
            depth: 0,
            limit,
            ...(locale ? { locale } : {}),
            overrideAccess: true,
            page,
            req,
            select: {
              [fieldName]: true,
            },
            where: {
              [fieldName]: {
                equals: id,
              },
            },
          })

          for (const doc of docs) {
            docsToUpdate.push({
              docID: doc.id,
              locale,
              value: removeIDFromValue(doc[fieldName as keyof typeof doc], id),
            })
          }

          if (!hasNextPage) {
            break
          }
          page += 1
        }
      })

      for (const { docID, locale, value } of docsToUpdate) {
        await req.payload.update({
          id: docID,
          collection: collectionSlug,
          data: {
            [fieldName]: value,
          },
          ...(locale ? { locale } : {}),
          overrideAccess: true,
          req,
        })
      }
    }
  }
