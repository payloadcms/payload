import type { Document } from '../../types/index.js'

type AdjustAffectedTreePathsArgs = {
  affectedDoc: Document
  newDoc: Document
  previousDocWithLocales: Document
  slugPathFieldName: string
  titlePathFieldName: string
} & (
  | {
      localeCodes: string[]
      localized: true
    }
  | {
      localeCodes?: never
      localized: false
    }
)
export function adjustAffectedTreePaths({
  affectedDoc,
  localeCodes,
  localized,
  newDoc,
  previousDocWithLocales,
  slugPathFieldName,
  titlePathFieldName,
}: AdjustAffectedTreePathsArgs): {
  slugPath: Record<string, string> | string
  titlePath: Record<string, string> | string
} {
  if (localized) {
    return localeCodes.reduce<{
      slugPath: Record<string, string>
      titlePath: Record<string, string>
    }>(
      (acc, locale) => {
        const slugPathToRemove = previousDocWithLocales[slugPathFieldName]?.[locale]
        const slugPathToAdd = newDoc[slugPathFieldName]?.[locale]
        const titlePathToRemove = previousDocWithLocales[titlePathFieldName]?.[locale]
        const titlePathToAdd = newDoc[titlePathFieldName]?.[locale]

        acc.slugPath[locale] =
          `${slugPathToAdd || ''}${affectedDoc[slugPathFieldName][locale].slice(slugPathToRemove.length)}`.replace(
            /^\/+|\/+$/g,
            '',
          )

        acc.titlePath[locale] =
          `${titlePathToAdd || ''}${affectedDoc[titlePathFieldName][locale].slice(titlePathToRemove.length)}`.replace(
            /^\/+|\/+$/g,
            '',
          )

        return acc
      },
      {
        slugPath: {},
        titlePath: {},
      },
    )
  } else {
    const slugPathToRemove = previousDocWithLocales[slugPathFieldName] // A/B/C
    const slugPathToAdd = newDoc[slugPathFieldName] // E/F/G
    const titlePathToRemove = previousDocWithLocales[titlePathFieldName]
    const titlePathToAdd = newDoc[titlePathFieldName]

    return {
      slugPath:
        `${slugPathToAdd || ''}${affectedDoc[slugPathFieldName].slice(slugPathToRemove.length)}`.replace(
          /^\/+|\/+$/g,
          '',
        ),
      titlePath:
        `${titlePathToAdd || ''}${affectedDoc[titlePathFieldName].slice(titlePathToRemove.length)}`.replace(
          /^\/+|\/+$/g,
          '',
        ),
    }
  }
}
