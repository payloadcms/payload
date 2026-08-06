import type { CollectionAfterChangeHook } from '../../../index.js'
import type { Document } from '../../../types/index.js'

import { computePaths } from '../../utils/computePaths.js'
import { isDocumentDraft } from '../../utils/isDocumentDraft.js'
import { hasStoredPathChanged } from './utils/hasStoredPathChanged.js'
import { syncChildDocuments } from './utils/syncChildDocuments.js'
import { syncCurrentDocumentLocale } from './utils/syncCurrentDocumentLocale.js'

type Args = {
  isPathLocalized: boolean
  parentFieldName: string
  slugPathFieldName: string
  titlePathFieldName: string
}

export const collectionAfterChangeStored =
  ({
    isPathLocalized,
    parentFieldName,
    slugPathFieldName,
    titlePathFieldName,
  }: Args): CollectionAfterChangeHook =>
  async ({ collection, context, doc, previousDoc, req }) => {
    if (context?.skipHierarchyStoredPathSync === true) {
      return doc
    }

    const locales = isPathLocalized
      ? req.payload.config.localization
        ? req.payload.config.localization.localeCodes
        : []
      : [req.locale || undefined]
    const currentLocale =
      req.locale ||
      (req.payload.config.localization ? req.payload.config.localization.defaultLocale : undefined)
    const draft = isDocumentDraft({
      doc,
      locale: currentLocale || req.locale || undefined,
    })
    const previousDraft = previousDoc
      ? isDocumentDraft({
          doc: previousDoc,
          locale: currentLocale || req.locale || undefined,
        })
      : false
    const becamePublished = previousDraft && !draft
    const pathsChanged = hasStoredPathChanged({
      doc,
      previousDoc,
      slugPathFieldName,
      titlePathFieldName,
    })

    if (!pathsChanged && !becamePublished) {
      return doc
    }

    const ancestorCache =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((req.context as any).hierarchyAncestorCache ||= {})

    delete ancestorCache[collection.slug]

    const currentDocPaths = await computePaths({
      collection,
      doc,
      draft,
      locale: currentLocale || req.locale || undefined,
      parentFieldName,
      req,
      slugPathFieldName,
      titlePathFieldName,
    })

    const seedHierarchyAncestorCache = ({
      document,
      draft: documentIsDraft,
      locale,
    }: {
      document: Document
      draft: boolean
      locale: string | undefined
    }) => {
      if (!ancestorCache[collection.slug]) {
        ancestorCache[collection.slug] = {}
      }

      ancestorCache[collection.slug][
        `${document.id}_${locale || 'default'}_${documentIsDraft ? 'draft' : 'published'}`
      ] = document
    }

    seedHierarchyAncestorCache({
      document: {
        ...doc,
        [slugPathFieldName]: currentDocPaths.slugPath,
        [titlePathFieldName]: currentDocPaths.titlePath,
      },
      draft,
      locale: currentLocale,
    })

    if (draft && previousDoc) {
      seedHierarchyAncestorCache({
        document: previousDoc,
        draft: false,
        locale: currentLocale,
      })
    }

    if (isPathLocalized && currentLocale) {
      for (const locale of locales) {
        if (!locale || locale === currentLocale) {
          continue
        }

        const updatedLocaleDoc = await syncCurrentDocumentLocale({
          collection,
          doc,
          draft: isDocumentDraft({
            doc,
            locale,
          }),
          locale,
          parentFieldName,
          req,
          slugPathFieldName,
          titlePathFieldName,
        })

        seedHierarchyAncestorCache({
          document: updatedLocaleDoc,
          draft: isDocumentDraft({
            doc: updatedLocaleDoc,
            locale,
          }),
          locale,
        })
      }
    }

    for (const locale of locales) {
      await syncChildDocuments({
        collection,
        docID: doc.id,
        locale,
        parentFieldName,
        req,
        slugPathFieldName,
        titlePathFieldName,
      })
    }

    return doc
  }
