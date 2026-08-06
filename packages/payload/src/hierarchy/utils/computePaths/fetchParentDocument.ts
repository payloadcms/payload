import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { Document, PayloadRequest } from '../../../types/index.js'

import { isDocumentDraft } from '../isDocumentDraft.js'

type FetchParentDocumentArgs = {
  collection: SanitizedCollectionConfig
  draft: boolean
  locale?: string
  parentFieldName: string
  parentID: number | string
  req: PayloadRequest
  shouldSlugifySlugSource: boolean
  slugify: (text: string) => string
  slugPathFieldName: string
  slugSourceFieldName: string
  titlePathFieldName: string
  titleSourceFieldName: string
}

const buildParentReadRequest = ({ req }: { req: PayloadRequest }): PayloadRequest => ({
  ...req,
  context: {
    ...req.context,
    computeHierarchyPaths: true,
    preserveHierarchyAutoSelectedFields: true,
  },
})

const fetchParentByLocale = async ({
  collectionSlug,
  draft,
  locale,
  parentID,
  parentReq,
  parentSelect,
  req,
}: {
  collectionSlug: string
  draft?: boolean
  locale?: string
  parentID: number | string
  parentReq: PayloadRequest
  parentSelect: Record<string, true>
  req: PayloadRequest
}): Promise<Document> => {
  const parent = await req.payload.findByID({
    id: parentID,
    collection: collectionSlug,
    depth: 0,
    draft,
    locale,
    overrideAccess: true,
    req: parentReq,
    select: parentSelect,
    user: req.user,
  })

  if (draft === false && isDocumentDraft({ doc: parent, locale })) {
    throw new Error(`Parent document "${parentID}" is draft`)
  }

  return parent
}

const fetchParentForAllLocalesFallback = async ({
  collection,
  parentFieldName,
  parentID,
  parentReq,
  parentSelect,
  req,
  shouldSlugifySlugSource,
  slugify,
  slugPathFieldName,
  slugSourceFieldName,
  titlePathFieldName,
  titleSourceFieldName,
}: {
  collection: SanitizedCollectionConfig
  parentFieldName: string
  parentID: number | string
  parentReq: PayloadRequest
  parentSelect: Record<string, true>
  req: PayloadRequest
  shouldSlugifySlugSource: boolean
  slugify: (text: string) => string
  slugPathFieldName: string
  slugSourceFieldName: string
  titlePathFieldName: string
  titleSourceFieldName: string
}): Promise<Document> => {
  try {
    return await fetchParentByLocale({
      collectionSlug: collection.slug,
      locale: 'all',
      parentID,
      parentReq,
      parentSelect,
      req,
    })
  } catch (_error) {
    const locales = req.payload.config.localization
      ? req.payload.config.localization.localeCodes
      : []
    const parentPathsByLocale: Record<
      string,
      { slugPath?: string; title?: string; titlePath?: string }
    > = {}

    for (const locale of locales) {
      try {
        const localeReq: PayloadRequest = {
          ...req,
          context: {
            ...req.context,
            computeHierarchyPaths: true,
            preserveHierarchyAutoSelectedFields: true,
          },
          locale,
        }

        const parentForLocale = await fetchParentByLocale({
          collectionSlug: collection.slug,
          draft: true,
          locale,
          parentID,
          parentReq: localeReq,
          parentSelect: {
            _status: true,
            [parentFieldName]: true,
            [slugPathFieldName]: true,
            [slugSourceFieldName]: true,
            [titlePathFieldName]: true,
            [titleSourceFieldName]: true,
          },
          req,
        })

        let localeSlugPath = parentForLocale[slugPathFieldName]
        let localeTitlePath = parentForLocale[titlePathFieldName]
        const localeTitle = parentForLocale[titleSourceFieldName]
        const localeSlugSource = parentForLocale[slugSourceFieldName]

        if (!localeSlugPath && localeSlugSource) {
          localeSlugPath = shouldSlugifySlugSource ? slugify(localeSlugSource) : localeSlugSource
        }
        if (!localeTitlePath && localeTitle) {
          localeTitlePath = localeTitle
        }

        parentPathsByLocale[locale] = {
          slugPath: localeSlugPath,
          title: localeTitle,
          titlePath: localeTitlePath,
        }
      } catch (_localeError) {
        // Locale can be missing for this draft; skip it.
      }
    }

    const combinedSlugPaths: Record<string, string | undefined> = {}
    const combinedTitlePaths: Record<string, string | undefined> = {}
    const combinedTitles: Record<string, string | undefined> = {}

    for (const locale of locales) {
      if (!parentPathsByLocale[locale]) {
        continue
      }

      combinedSlugPaths[locale] = parentPathsByLocale[locale].slugPath
      combinedTitlePaths[locale] = parentPathsByLocale[locale].titlePath
      combinedTitles[locale] = parentPathsByLocale[locale].title
    }

    return {
      id: parentID,
      [slugPathFieldName]: combinedSlugPaths,
      [titlePathFieldName]: combinedTitlePaths,
      [titleSourceFieldName]: combinedTitles,
    }
  }
}

export const fetchParentDocument = async ({
  collection,
  draft,
  locale,
  parentFieldName,
  parentID,
  req,
  shouldSlugifySlugSource,
  slugify,
  slugPathFieldName,
  slugSourceFieldName,
  titlePathFieldName,
  titleSourceFieldName,
}: FetchParentDocumentArgs): Promise<Document> => {
  const parentReq = buildParentReadRequest({ req })
  const parentSelect = {
    _status: true,
    [parentFieldName]: true,
    [slugPathFieldName]: true,
    [slugSourceFieldName]: true,
    [titlePathFieldName]: true,
    [titleSourceFieldName]: true,
  } as Record<string, true>

  if (locale === 'all') {
    return await fetchParentForAllLocalesFallback({
      collection,
      parentFieldName,
      parentID,
      parentReq,
      parentSelect,
      req,
      shouldSlugifySlugSource,
      slugify,
      slugPathFieldName,
      slugSourceFieldName,
      titlePathFieldName,
      titleSourceFieldName,
    })
  }

  return await fetchParentByLocale({
    collectionSlug: collection.slug,
    draft,
    locale,
    parentID,
    parentReq,
    parentSelect,
    req,
  })
}
