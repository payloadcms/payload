import type { Block, Field, FlattenedBlock } from '../fields/config/types.js'
import type { SanitizedConfig } from '../index.js'
import type { JsonObject } from '../types/index.js'

import { fieldAffectsData, fieldShouldBeLocalized, tabHasName } from '../fields/config/types.js'

type IsValidationErrorPathLocalizedArgs = {
  configBlockReferences: SanitizedConfig['blocks']
  data: JsonObject
  fields: Field[]
  path: string
}

/**
 * Reports whether a `ValidationFieldError.path` refers to a localized field, by walking `fields`
 * and `data` together the same way `projectNonLocalizedData` does. Used to tell apart a candidate
 * error that's inherently per-locale from one for a shared, non-localized field that every locale
 * pass in `runLocaleScopedValidation` re-validates identically. A path that can't be resolved
 * (unknown field, malformed path) is conservatively treated as localized, since wrongly collapsing
 * a genuinely per-locale error into one is worse than leaving an occasional duplicate.
 */
export function isValidationErrorPathLocalized({
  configBlockReferences,
  data,
  fields,
  path,
}: IsValidationErrorPathLocalizedArgs): boolean {
  return (
    resolvePathLocalization({
      configBlockReferences,
      data,
      fields,
      parentIsLocalized: false,
      segments: path.split('.'),
    }) ?? true
  )
}

type ResolvePathLocalizationArgs = {
  configBlockReferences: SanitizedConfig['blocks']
  data: unknown
  fields: Field[]
  parentIsLocalized: boolean
  segments: string[]
}

/**
 * Returns `undefined` when `segments[0]` matches no field at this level, so the caller can keep
 * searching sibling fields (relevant for `row`/`collapsible`/unnamed `tabs`, which don't consume a
 * path segment themselves).
 */
function resolvePathLocalization({
  configBlockReferences,
  data,
  fields,
  parentIsLocalized,
  segments,
}: ResolvePathLocalizationArgs): boolean | undefined {
  const [segment, ...remainingSegments] = segments

  if (segment === undefined) {
    return parentIsLocalized
  }

  if (/^\d+$/.test(segment) && Array.isArray(data)) {
    return resolvePathLocalization({
      configBlockReferences,
      data: data[Number(segment)],
      fields,
      parentIsLocalized,
      segments: remainingSegments,
    })
  }

  for (const field of fields) {
    if (fieldAffectsData(field)) {
      if (field.name !== segment) {
        continue
      }

      const isLocalized = parentIsLocalized || fieldShouldBeLocalized({ field, parentIsLocalized })

      if (remainingSegments.length === 0) {
        return isLocalized
      }

      const fieldValue = isObject(data) ? data[segment] : undefined

      switch (field.type) {
        case 'array':
        case 'group':
          return (
            resolvePathLocalization({
              configBlockReferences,
              data: fieldValue,
              fields: field.fields,
              parentIsLocalized: isLocalized,
              segments: remainingSegments,
            }) ?? isLocalized
          )

        case 'blocks': {
          if (!Array.isArray(fieldValue)) {
            return isLocalized
          }

          const [rowSegment, ...afterRow] = remainingSegments
          const row =
            rowSegment && /^\d+$/.test(rowSegment) ? fieldValue[Number(rowSegment)] : undefined

          if (!isObject(row)) {
            return isLocalized
          }

          const blockOrSlug = field.blocks.find((block) => {
            const slug = typeof block === 'string' ? block : block.slug
            return slug === row.blockType
          })
          const block: Block | FlattenedBlock | undefined =
            typeof blockOrSlug === 'string'
              ? configBlockReferences?.find(({ slug }) => slug === blockOrSlug)
              : blockOrSlug

          if (!block) {
            return isLocalized
          }

          return (
            resolvePathLocalization({
              configBlockReferences,
              data: row,
              fields: block.fields,
              parentIsLocalized: isLocalized,
              segments: afterRow,
            }) ?? isLocalized
          )
        }

        default:
          return isLocalized
      }
    }

    switch (field.type) {
      case 'collapsible':
      case 'row': {
        const nested = resolvePathLocalization({
          configBlockReferences,
          data,
          fields: field.fields,
          parentIsLocalized,
          segments,
        })

        if (nested !== undefined) {
          return nested
        }

        continue
      }

      case 'tabs': {
        for (const tab of field.tabs) {
          if (!tabHasName(tab)) {
            const nested = resolvePathLocalization({
              configBlockReferences,
              data,
              fields: tab.fields,
              parentIsLocalized,
              segments,
            })

            if (nested !== undefined) {
              return nested
            }

            continue
          }

          if (tab.name !== segment) {
            continue
          }

          const isLocalized =
            parentIsLocalized || fieldShouldBeLocalized({ field: tab, parentIsLocalized })

          if (remainingSegments.length === 0) {
            return isLocalized
          }

          const tabValue = isObject(data) ? data[segment] : undefined

          return (
            resolvePathLocalization({
              configBlockReferences,
              data: tabValue,
              fields: tab.fields,
              parentIsLocalized: isLocalized,
              segments: remainingSegments,
            }) ?? isLocalized
          )
        }

        continue
      }
    }
  }

  return undefined
}

function isObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
