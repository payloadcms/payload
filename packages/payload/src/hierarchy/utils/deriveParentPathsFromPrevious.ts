import type { Document } from '../../index.js'

/**
 * Derives the parent's path fields by stripping the last segment from the previous document's paths.
 * This optimization avoids a database query when only the title changes.
 *
 * Examples:
 * - Non-localized: "grandparent/parent/old-title" → "grandparent/parent"
 * - Root level: "my-document" → "" (empty string)
 * - Localized: { en: "parent/old", fr: "parent/ancien" } → { en: "parent", fr: "parent" }
 *
 * @param previousDocWithLocales - The previous version of the document with all locale data
 * @param slugPathFieldName - The field name for slug paths (e.g., "_prefixSlugPath")
 * @param titlePathFieldName - The field name for title paths (e.g., "_prefixTitlePath")
 * @param fieldIsLocalized - Whether the path fields are localized
 * @param localeCodes - Array of locale codes to process (only used if fieldIsLocalized is true)
 * @returns A mock parent document with derived path fields, or undefined if paths can't be derived
 */
export function deriveParentPathsFromPrevious({
  fieldIsLocalized,
  localeCodes,
  previousDocWithLocales,
  slugPathFieldName,
  titlePathFieldName,
}: {
  fieldIsLocalized: boolean
  localeCodes?: string[]
  previousDocWithLocales: Document
  slugPathFieldName: string
  titlePathFieldName: string
}):
  | {
      slugPath?: Record<string, string> | string
      titlePath?: Record<string, string> | string
    }
  | undefined {
  const previousSlugPath = previousDocWithLocales[slugPathFieldName]
  const previousTitlePath = previousDocWithLocales[titlePathFieldName]

  // Can't derive if previous paths don't exist
  if (!previousSlugPath || !previousTitlePath) {
    return undefined
  }

  // Helper to strip last segment from a path
  const stripLastSegment = (path: string): string => {
    const segments = path.split('/')
    return segments.slice(0, -1).join('/')
  }

  // Handle localized paths - explicitly loop through locale codes
  if (fieldIsLocalized && localeCodes && localeCodes.length > 0) {
    if (typeof previousSlugPath !== 'object' || typeof previousTitlePath !== 'object') {
      // Expected localized but got string - data inconsistency
      return undefined
    }

    const derivedSlugPath: Record<string, string> = {}
    const derivedTitlePath: Record<string, string> = {}

    // Explicitly process each locale from config
    for (const locale of localeCodes) {
      const slugPathForLocale = previousSlugPath[locale]
      const titlePathForLocale = previousTitlePath[locale]

      if (typeof slugPathForLocale === 'string') {
        derivedSlugPath[locale] = stripLastSegment(slugPathForLocale)
      }

      if (typeof titlePathForLocale === 'string') {
        derivedTitlePath[locale] = stripLastSegment(titlePathForLocale)
      }
    }

    // If we couldn't derive any paths, return undefined so caller can fetch parent
    if (Object.keys(derivedSlugPath).length === 0 || Object.keys(derivedTitlePath).length === 0) {
      return undefined
    }

    return {
      slugPath: derivedSlugPath,
      titlePath: derivedTitlePath,
    }
  }

  // Handle non-localized paths (simple strings)
  if (
    !fieldIsLocalized &&
    typeof previousSlugPath === 'string' &&
    typeof previousTitlePath === 'string'
  ) {
    return {
      slugPath: stripLastSegment(previousSlugPath),
      titlePath: stripLastSegment(previousTitlePath),
    }
  }

  // Data inconsistency - expected non-localized but got object, or vice versa
  return undefined
}
