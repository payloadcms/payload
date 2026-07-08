import type { CollectionAfterChangeHook } from '../../../index.js'
import type { Document } from '../../../types/index.js'

import { fieldAffectsData } from '../../../fields/config/types.js'
import { computePaths } from '../../utils/computePaths.js'
import { findFieldByName } from '../../utils/findUseAsTitle.js'
import { isDocumentDraft } from '../../utils/isDocumentDraft.js'
import { hasStoredPathChanged } from './utils/hasStoredPathChanged.js'
import { syncChildDocuments } from './utils/syncChildDocuments.js'
import { syncCurrentDocumentLocale } from './utils/syncCurrentDocumentLocale.js'

type Args = {
  parentFieldName: string
  pathStrategy: 'stored' | 'virtual'
  slugPathFieldName: string
  titlePathFieldName: string
}

export const collectionAfterChangeStored =
  ({
    parentFieldName,
    pathStrategy,
    slugPathFieldName,
    titlePathFieldName,
  }: Args): CollectionAfterChangeHook =>
  async ({ collection, context, doc, previousDoc, req }) => {
    if (pathStrategy !== 'stored' || context?.skipHierarchyStoredPathSync === true) {
      return doc
    }

    const storedSlugField = findFieldByName(collection, slugPathFieldName)
    const storedTitleField = findFieldByName(collection, titlePathFieldName)
    const shouldSyncAllLocales = Boolean(storedSlugField?.localized || storedTitleField?.localized)
    const dataFieldNames = collection.fields
      .filter((field) => fieldAffectsData(field))
      .map((field) => field.name)
    const locales = shouldSyncAllLocales
      ? req.payload.config.localization?.localeCodes || []
      : [req.locale || undefined]
    const currentLocale = req.locale || req.payload.config.localization?.defaultLocale
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

    if (shouldSyncAllLocales && currentLocale) {
      for (const locale of locales) {
        if (!locale || locale === currentLocale) {
          continue
        }

        const updatedLocaleDoc = await syncCurrentDocumentLocale({
          collection,
          dataFieldNames,
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
        dataFieldNames,
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
