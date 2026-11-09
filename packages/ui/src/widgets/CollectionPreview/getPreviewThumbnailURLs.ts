import type { PayloadRequest, SanitizedCollectionConfig } from 'payload'

import { getDocumentThumbnail } from '../../utilities/getDocumentThumbnail.js'
import { getDocumentThumbnailSelect } from '../../utilities/getDocumentThumbnailSelect.js'

/** Resolve card thumbnails without populating the documents used by table cells. */
export async function getPreviewThumbnailURLs({
  collection,
  docs,
  req,
}: {
  collection: SanitizedCollectionConfig
  docs: Record<string, unknown>[]
  req: PayloadRequest
}): Promise<Map<unknown, string | undefined>> {
  const thumbnailField = collection.admin.useAsThumbnail
  const field = collection.flattenedFields.find(
    (field) => field.name === thumbnailField && field.type === 'upload',
  )
  const thumbnailURLs = new Map(
    docs.map((doc) => [doc.id, getDocumentThumbnail({ doc, useAsThumbnail: thumbnailField })]),
  )

  if (!field || !('relationTo' in field) || !thumbnailField) {
    return thumbnailURLs
  }

  const references = new Map<unknown, { collection: string; id: number | string }>()
  const idsByCollection = new Map<string, Set<number | string>>()

  for (const doc of docs) {
    const value = doc[thumbnailField]
    const firstValue = Array.isArray(value) ? value[0] : value
    const isPolymorphic = Array.isArray(field.relationTo)
    const polymorphicValue =
      firstValue &&
      typeof firstValue === 'object' &&
      'relationTo' in firstValue &&
      'value' in firstValue
        ? firstValue
        : undefined
    const relatedCollection = isPolymorphic ? polymorphicValue?.relationTo : field.relationTo
    const uploadValue = isPolymorphic ? polymorphicValue?.value : firstValue
    const id =
      uploadValue && typeof uploadValue === 'object' && 'id' in uploadValue
        ? uploadValue.id
        : uploadValue

    if (
      typeof relatedCollection !== 'string' ||
      !(Array.isArray(field.relationTo)
        ? field.relationTo.includes(relatedCollection)
        : relatedCollection === field.relationTo) ||
      (typeof id !== 'string' && typeof id !== 'number')
    ) {
      continue
    }

    references.set(doc.id, { id, collection: relatedCollection })
    thumbnailURLs.set(doc.id, undefined)

    const ids = idsByCollection.get(relatedCollection) ?? new Set<number | string>()

    ids.add(id)
    idsByCollection.set(relatedCollection, ids)
  }

  for (const [collectionSlug, ids] of idsByCollection) {
    const relatedCollection = req.payload.collections[collectionSlug]?.config

    if (!relatedCollection?.upload) {
      continue
    }

    try {
      const result = await req.payload.find({
        collection: collectionSlug,
        depth: 0,
        draft: true,
        limit: ids.size,
        overrideAccess: false,
        pagination: false,
        req,
        select: getDocumentThumbnailSelect({ collectionConfig: relatedCollection }),
        user: req.user,
        where: { id: { in: [...ids] } },
      })
      const uploads = new Map(result.docs.map((doc) => [doc.id, doc]))

      for (const [documentID, reference] of references) {
        if (reference.collection !== collectionSlug) {
          continue
        }

        const upload = uploads.get(reference.id)

        thumbnailURLs.set(documentID, upload ? getDocumentThumbnail({ doc: upload }) : undefined)
      }
    } catch (err) {
      req.payload.logger.error({
        err,
        msg: `CollectionPreviewWidget: failed to query thumbnails from "${collectionSlug}"`,
      })
    }
  }

  return thumbnailURLs
}
