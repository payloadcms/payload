import type { SanitizedCollectionConfig } from '../../../../collections/config/types.js'
import type { PayloadRequest } from '../../../../index.js'
import type { Document } from '../../../../types/index.js'

import { computePaths } from '../../../utils/computePaths.js'
import { isDocumentDraft } from '../../../utils/isDocumentDraft.js'
import { buildUpdateDataFromDocument } from './buildUpdateDataFromDocument.js'
import { shouldSkipStoredPathSyncUpdate } from './shouldSkipStoredPathSyncUpdate.js'

export const syncChildDocuments = async ({
  collection,
  dataFieldNames,
  docID,
  locale,
  parentFieldName,
  req,
  slugPathFieldName,
  titlePathFieldName,
}: {
  collection: SanitizedCollectionConfig
  dataFieldNames: string[]
  docID: number | string
  locale: string | undefined
  parentFieldName: string
  req: PayloadRequest
  slugPathFieldName: string
  titlePathFieldName: string
}) => {
  const initialDraftChildren = await req.payload.find({
    collection: collection.slug,
    depth: 0,
    draft: true,
    limit: 0,
    locale,
    req,
    where: {
      [parentFieldName]: {
        equals: docID,
      },
    },
  })

  const draftChildren = initialDraftChildren.docs.filter((child) =>
    isDocumentDraft({ doc: child, locale }),
  )

  const publishedChildren = await req.payload.find({
    collection: collection.slug,
    depth: 0,
    draft: false,
    limit: 0,
    locale,
    req,
    where: {
      [parentFieldName]: {
        equals: docID,
      },
    },
  })

  const childrenByID = [...draftChildren, ...publishedChildren.docs].reduce<
    Record<string, Document[]>
  >((acc, child) => {
    acc[String(child.id)] = acc[String(child.id)] || []
    acc[String(child.id)]!.push(child)
    return acc
  }, {})

  const sortedChildren = Object.values(childrenByID).flatMap((group) =>
    group.sort((a, b) => {
      if (a.updatedAt !== b.updatedAt) {
        return a.updatedAt > b.updatedAt ? 1 : -1
      }

      return isDocumentDraft({ doc: a, locale }) ? -1 : 1
    }),
  )

  for (const child of sortedChildren) {
    const childDraft = isDocumentDraft({ doc: child, locale })

    const { slugPath, titlePath } = await computePaths({
      collection,
      doc: child,
      draft: childDraft,
      locale,
      parentFieldName,
      req,
      slugPathFieldName,
      titlePathFieldName,
    })

    const shouldSkipPathSync = shouldSkipStoredPathSyncUpdate({
      currentDoc: child,
      nextSlugPath: slugPath,
      nextTitlePath: titlePath,
      slugPathFieldName,
      titlePathFieldName,
    })

    if (!shouldSkipPathSync) {
      const updateData = buildUpdateDataFromDocument({
        dataFieldNames,
        doc: child,
      })

      await req.payload.update({
        id: child.id,
        collection: collection.slug,
        data: updateData,
        depth: 0,
        draft: childDraft,
        locale,
        req: {
          ...req,
          context: {
            ...req.context,
            skipHierarchyStoredPathSync: true,
          },
        },
      })
    }

    await syncChildDocuments({
      collection,
      dataFieldNames,
      docID: child.id,
      locale,
      parentFieldName,
      req,
      slugPathFieldName,
      titlePathFieldName,
    })
  }
}
