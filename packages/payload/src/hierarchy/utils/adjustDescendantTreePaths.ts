import type { Document } from '../../types/index.js'

type AdjustAffectedTreePathsArgs = {
  affectedDoc: Document
  fieldIsLocalized: boolean
  localeCodes?: string[]
  newDoc: Document
  previousDocWithLocales: Document
  slugPathFieldName: string
  titlePathFieldName: string
}

/**
 * Adjusts tree paths for a descendant document when an ancestor's path changes
 * Handles both localized and non-localized fields
 */
export function adjustDescendantTreePaths({
  affectedDoc,
  fieldIsLocalized,
  localeCodes,
  newDoc,
  previousDocWithLocales,
  slugPathFieldName,
  titlePathFieldName,
}: AdjustAffectedTreePathsArgs): {
  slugPath: Record<string, string> | string
  titlePath: Record<string, string> | string
} {
  if (fieldIsLocalized && localeCodes) {
    const slugPathByLocale: Record<string, string> = {}
    const titlePathByLocale: Record<string, string> = {}

    for (const locale of localeCodes) {
      const slugPathToRemove = (previousDocWithLocales[slugPathFieldName]?.[locale] as string) || ''
      const slugPathToAdd = (newDoc[slugPathFieldName]?.[locale] as string) || ''
      const titlePathToRemove =
        (previousDocWithLocales[titlePathFieldName]?.[locale] as string) || ''
      const titlePathToAdd = (newDoc[titlePathFieldName]?.[locale] as string) || ''

      const affectedSlugPath = (affectedDoc[slugPathFieldName][locale] as string) || ''
      const affectedTitlePath = (affectedDoc[titlePathFieldName][locale] as string) || ''

      slugPathByLocale[locale] =
        `${slugPathToAdd}${affectedSlugPath.slice(slugPathToRemove.length)}`.replace(
          /^\/+|\/+$/g,
          '',
        )
      titlePathByLocale[locale] =
        `${titlePathToAdd}${affectedTitlePath.slice(titlePathToRemove.length)}`.replace(
          /^\/+|\/+$/g,
          '',
        )
    }

    return {
      slugPath: slugPathByLocale,
      titlePath: titlePathByLocale,
    }
  } else {
    const slugPathToRemove = (previousDocWithLocales[slugPathFieldName] as string) || ''
    const slugPathToAdd = (newDoc[slugPathFieldName] as string) || ''
    const titlePathToRemove = (previousDocWithLocales[titlePathFieldName] as string) || ''
    const titlePathToAdd = (newDoc[titlePathFieldName] as string) || ''

    const affectedSlugPath = (affectedDoc[slugPathFieldName] as string) || ''
    const affectedTitlePath = (affectedDoc[titlePathFieldName] as string) || ''

    return {
      slugPath: `${slugPathToAdd}${affectedSlugPath.slice(slugPathToRemove.length)}`.replace(
        /^\/+|\/+$/g,
        '',
      ),
      titlePath: `${titlePathToAdd}${affectedTitlePath.slice(titlePathToRemove.length)}`.replace(
        /^\/+|\/+$/g,
        '',
      ),
    }
  }
}
