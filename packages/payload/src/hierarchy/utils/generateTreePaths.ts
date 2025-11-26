import type { Document } from '../../types/index.js'

export type GenerateTreePathsArgs = {
  newDoc: Document
  parentDocument?: Document
  previousDocWithLocales: Document
  slugify: (text: string) => string
  slugPathFieldName: string
  titleFieldName: string
  titlePathFieldName: string
} & (
  | {
      defaultLocale?: never
      localeCodes?: never
      localized: false
      reqLocale?: never
    }
  | {
      localeCodes: string[]
      localized: true
      reqLocale: string
    }
)
export function generateTreePaths({
  localeCodes,
  localized,
  newDoc,
  parentDocument,
  previousDocWithLocales,
  reqLocale,
  slugify,
  slugPathFieldName,
  titleFieldName,
  titlePathFieldName,
}: GenerateTreePathsArgs): {
  slugPath: Record<string, string> | string
  titlePath: Record<string, string> | string
} {
  if (localized) {
    return localeCodes.reduce<{
      slugPath: Record<string, string>
      titlePath: Record<string, string>
    }>(
      (acc, locale: string) => {
        const slugPrefix = parentDocument ? parentDocument?.[slugPathFieldName]?.[locale] : ''
        const titlePrefix = parentDocument ? parentDocument?.[titlePathFieldName]?.[locale] : ''

        let title = newDoc[titleFieldName]
        if (reqLocale !== locale && previousDocWithLocales?.[titleFieldName]?.[locale]) {
          title = previousDocWithLocales[titleFieldName][locale]
        }

        acc.slugPath[locale] = `${slugPrefix ? `${slugPrefix}/` : ''}${slugify(title)}`
        acc.titlePath[locale] = `${titlePrefix ? `${titlePrefix}/` : ''}${title}`
        return acc
      },
      {
        slugPath: {},
        titlePath: {},
      },
    )
  } else {
    const slugPrefix = parentDocument ? parentDocument?.[slugPathFieldName] : ''
    const titlePrefix = parentDocument ? parentDocument?.[titlePathFieldName] : ''
    const title = newDoc[titleFieldName]

    return {
      slugPath: `${slugPrefix ? `${slugPrefix}/` : ''}${slugify(title)}`,
      titlePath: `${titlePrefix ? `${titlePrefix}/` : ''}${title}`,
    }
  }
}
