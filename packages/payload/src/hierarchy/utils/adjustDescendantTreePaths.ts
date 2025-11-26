import type { HierarchyDataT } from '../types.js'

type AdjustAffectedTreePathsArgs = {
  doc: HierarchyDataT
  fieldIsLocalized: boolean
  localeCodes?: string[]
  parentDoc: HierarchyDataT
}

/**
 * Adjusts tree paths for a descendant document when an ancestor's path changes
 * Handles both localized and non-localized fields
 */
export function adjustDescendantTreePaths({
  doc,
  fieldIsLocalized,
  localeCodes,
  parentDoc,
}: AdjustAffectedTreePathsArgs): {
  slugPath: Record<string, string> | string
  titlePath: Record<string, string> | string
} {
  if (fieldIsLocalized && localeCodes) {
    const slugPathByLocale: Record<string, string> = {}
    const titlePathByLocale: Record<string, string> = {}

    for (const locale of localeCodes) {
      const parentSlugPath = (parentDoc.slugPath as Record<string, string>)?.[locale] || ''
      const parentTitlePath = (parentDoc.titlePath as Record<string, string>)?.[locale] || ''

      const affectedSlugPath = (doc.slugPath as Record<string, string>)?.[locale] || ''
      const affectedTitlePath = (doc.titlePath as Record<string, string>)?.[locale] || ''

      slugPathByLocale[locale] =
        `${parentSlugPath}${affectedSlugPath.slice(parentSlugPath.length)}`.replace(
          /^\/+|\/+$/g,
          '',
        )
      titlePathByLocale[locale] =
        `${parentTitlePath}${affectedTitlePath.slice(parentTitlePath.length)}`.replace(
          /^\/+|\/+$/g,
          '',
        )
    }

    return {
      slugPath: slugPathByLocale,
      titlePath: titlePathByLocale,
    }
  } else {
    const parentSlugPath = (parentDoc.slugPath as string) || ''
    const affectedSlugPath = (doc.slugPath as string) || ''

    const parentTitlePath = (parentDoc.titlePath as string) || ''
    const affectedTitlePath = (doc.titlePath as string) || ''

    return {
      slugPath: `${parentSlugPath}${affectedSlugPath.slice(parentSlugPath.length)}`.replace(
        /^\/+|\/+$/g,
        '',
      ),
      titlePath: `${parentTitlePath}${affectedTitlePath.slice(parentTitlePath.length)}`.replace(
        /^\/+|\/+$/g,
        '',
      ),
    }
  }
}
