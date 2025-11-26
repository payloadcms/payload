import type { HierarchyDataT } from '../types.js'

type AdjustAffectedTreePathsArgs = {
  doc: HierarchyDataT
  fieldIsLocalized: boolean
  localeCodes?: string[]
  parentDoc: HierarchyDataT
  previousParentDoc: HierarchyDataT
}

/**
 * Adjusts tree paths for a descendant document when an ancestor's path changes
 * Handles both localized and non-localized fields
 *
 * Algorithm:
 * 1. Strip the old parent's path prefix from the descendant's current path
 * 2. Prepend the new parent's path prefix
 *
 * Example:
 * - Old parent path: "a/b"
 * - Descendant path: "a/b/c/descendant"
 * - New parent path: "x/y"
 * - Result: "x/y/c/descendant" (strip "a/b/", keep "c/descendant", prepend "x/y/")
 */
export function adjustDescendantTreePaths({
  doc,
  fieldIsLocalized,
  localeCodes,
  parentDoc,
  previousParentDoc,
}: AdjustAffectedTreePathsArgs): {
  slugPath: Record<string, string> | string
  titlePath: Record<string, string> | string
} {
  if (fieldIsLocalized && localeCodes) {
    const slugPathByLocale: Record<string, string> = {}
    const titlePathByLocale: Record<string, string> = {}

    for (const locale of localeCodes) {
      const newParentSlugPath = (parentDoc.slugPath as Record<string, string>)?.[locale] || ''
      const newParentTitlePath = (parentDoc.titlePath as Record<string, string>)?.[locale] || ''

      const previousParentSlugPath =
        (previousParentDoc.slugPath as Record<string, string>)?.[locale] || ''
      const previousParentTitlePath =
        (previousParentDoc.titlePath as Record<string, string>)?.[locale] || ''

      const affectedSlugPath = (doc.slugPath as Record<string, string>)?.[locale] || ''
      const affectedTitlePath = (doc.titlePath as Record<string, string>)?.[locale] || ''

      // Strip old parent prefix, then add new parent prefix
      const slugPathWithoutOldPrefix = previousParentSlugPath
        ? affectedSlugPath.slice(previousParentSlugPath.length).replace(/^\/+/, '')
        : affectedSlugPath

      const titlePathWithoutOldPrefix = previousParentTitlePath
        ? affectedTitlePath.slice(previousParentTitlePath.length).replace(/^\/+/, '')
        : affectedTitlePath

      slugPathByLocale[locale] = newParentSlugPath
        ? `${newParentSlugPath}/${slugPathWithoutOldPrefix}`.replace(/^\/+|\/+$/g, '')
        : slugPathWithoutOldPrefix

      titlePathByLocale[locale] = newParentTitlePath
        ? `${newParentTitlePath}/${titlePathWithoutOldPrefix}`.replace(/^\/+|\/+$/g, '')
        : titlePathWithoutOldPrefix
    }

    return {
      slugPath: slugPathByLocale,
      titlePath: titlePathByLocale,
    }
  } else {
    const newParentSlugPath = (parentDoc.slugPath as string) || ''
    const newParentTitlePath = (parentDoc.titlePath as string) || ''

    const previousParentSlugPath = (previousParentDoc.slugPath as string) || ''
    const previousParentTitlePath = (previousParentDoc.titlePath as string) || ''

    const affectedSlugPath = (doc.slugPath as string) || ''
    const affectedTitlePath = (doc.titlePath as string) || ''

    // Strip old parent prefix, then add new parent prefix
    const slugPathWithoutOldPrefix = previousParentSlugPath
      ? affectedSlugPath.slice(previousParentSlugPath.length).replace(/^\/+/, '')
      : affectedSlugPath

    const titlePathWithoutOldPrefix = previousParentTitlePath
      ? affectedTitlePath.slice(previousParentTitlePath.length).replace(/^\/+/, '')
      : affectedTitlePath

    return {
      slugPath: newParentSlugPath
        ? `${newParentSlugPath}/${slugPathWithoutOldPrefix}`.replace(/^\/+|\/+$/g, '')
        : slugPathWithoutOldPrefix,
      titlePath: newParentTitlePath
        ? `${newParentTitlePath}/${titlePathWithoutOldPrefix}`.replace(/^\/+|\/+$/g, '')
        : titlePathWithoutOldPrefix,
    }
  }
}
