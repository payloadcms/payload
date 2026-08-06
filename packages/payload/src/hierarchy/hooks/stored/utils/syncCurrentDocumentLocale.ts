import type { SanitizedCollectionConfig } from '../../../../collections/config/types.js'
import type { PayloadRequest } from '../../../../index.js'
import type { Document } from '../../../../types/index.js'

import { computePaths } from '../../../utils/computePaths.js'
import { isDocumentDraft } from '../../../utils/isDocumentDraft.js'
import { buildStoredPathUpdateData } from './buildStoredPathUpdateData.js'
import { shouldSkipStoredPathSyncUpdate } from './shouldSkipStoredPathSyncUpdate.js'

export const syncCurrentDocumentLocale = async ({
  collection,
  doc,
  draft,
  locale,
  parentFieldName,
  req,
  slugPathFieldName,
  titlePathFieldName,
}: {
  collection: SanitizedCollectionConfig
  doc: Document
  draft: boolean
  locale: string
  parentFieldName: string
  req: PayloadRequest
  slugPathFieldName: string
  titlePathFieldName: string
}): Promise<Document> => {
  const localeDoc = await req.payload.findByID({
    id: doc.id,
    collection: collection.slug,
    depth: 0,
    draft,
    fallbackLocale: false,
    locale,
    req,
  })

  if (localeDoc[slugPathFieldName] === undefined && localeDoc[titlePathFieldName] === undefined) {
    return localeDoc
  }

  const localeDraft = isDocumentDraft({
    doc: localeDoc,
    locale,
  })

  const { slugPath, titlePath } = await computePaths({
    collection,
    doc: localeDoc,
    draft: localeDraft,
    locale,
    parentFieldName,
    req,
    slugPathFieldName,
    titlePathFieldName,
  })

  if (
    shouldSkipStoredPathSyncUpdate({
      currentDoc: localeDoc,
      nextSlugPath: slugPath,
      nextTitlePath: titlePath,
      slugPathFieldName,
      titlePathFieldName,
    })
  ) {
    return {
      ...localeDoc,
      [slugPathFieldName]: slugPath,
      [titlePathFieldName]: titlePath,
    }
  }

  const updateData = buildStoredPathUpdateData({
    slugPath,
    slugPathFieldName,
    titlePath,
    titlePathFieldName,
  })

  return await req.payload.update({
    id: doc.id,
    collection: collection.slug,
    data: updateData,
    depth: 0,
    draft: localeDraft,
    locale,
    req: {
      ...req,
      context: {
        ...req.context,
        skipHierarchyStoredPathSync: true,
      },
      locale,
    },
  })
}
