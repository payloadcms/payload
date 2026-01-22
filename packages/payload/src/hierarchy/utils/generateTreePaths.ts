import type { Document } from '../../types/index.js'

export type GenerateTreePathsArgs = {
  docWithLocales: Document
  previousDocWithLocales: Document
  slugify: (text: string) => string
  titleFieldName: string
  treeData?: {
    parentSlugPath?: Record<string, string> | string
    parentTitlePath?: Record<string, string> | string
  }
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
  docWithLocales,
  localeCodes,
  localized,
  previousDocWithLocales,
  reqLocale,
  slugify,
  titleFieldName,
  treeData,
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
        const slugPrefix =
          treeData && typeof treeData?.parentSlugPath === 'object'
            ? treeData?.parentSlugPath?.[locale]
            : ''
        const titlePrefix =
          treeData && typeof treeData?.parentTitlePath === 'object'
            ? treeData?.parentTitlePath?.[locale]
            : ''

        let title: string | undefined

        // Handle case where titleField is a string (current locale only) vs object (all locales)
        const titleValue = docWithLocales[titleFieldName]
        if (typeof titleValue === 'string') {
          // Title is a string - this is the value for reqLocale only
          if (locale === reqLocale) {
            title = titleValue
          } else if (previousDocWithLocales?.[titleFieldName]?.[locale]) {
            // For other locales, use previous value
            title = previousDocWithLocales[titleFieldName][locale]
          }
        } else if (typeof titleValue === 'object' && titleValue !== null) {
          // Title is an object with locale keys
          title = titleValue[locale]

          if (reqLocale !== locale && previousDocWithLocales?.[titleFieldName]?.[locale]) {
            title = previousDocWithLocales[titleFieldName][locale]
          }
        }

        if (title) {
          acc.slugPath[locale] = `${slugPrefix ? `${slugPrefix}/` : ''}${slugify(title)}`
          acc.titlePath[locale] = `${titlePrefix ? `${titlePrefix}/` : ''}${title}`
        }

        return acc
      },
      {
        slugPath: {},
        titlePath: {},
      },
    )
  } else {
    const slugPrefix: string = treeData ? (treeData.parentSlugPath as string) : ''
    const titlePrefix: string = treeData ? (treeData.parentTitlePath as string) : ''
    const title = docWithLocales[titleFieldName]

    return {
      slugPath: `${slugPrefix ? `${slugPrefix}/` : ''}${slugify(title)}`,
      titlePath: `${titlePrefix ? `${titlePrefix}/` : ''}${title}`,
    }
  }
}
