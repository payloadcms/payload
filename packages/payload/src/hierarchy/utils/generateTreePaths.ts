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

        let title = docWithLocales[titleFieldName]?.[locale]

        if (reqLocale !== locale && previousDocWithLocales?.[titleFieldName]?.[locale]) {
          title = previousDocWithLocales[titleFieldName][locale]
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
