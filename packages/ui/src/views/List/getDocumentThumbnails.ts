import type { ListViewClientProps, PayloadRequest, SanitizedCollectionConfig } from 'payload'

import { getDocumentThumbnail } from '../../utilities/getDocumentThumbnail.js'
import { getDocumentThumbnailSelect } from '../../utilities/getDocumentThumbnailSelect.js'

export async function getDocumentThumbnails({
  collectionConfig,
  docs,
  req,
}: {
  collectionConfig: SanitizedCollectionConfig
  docs: Record<string, unknown>[]
  req: PayloadRequest
}): Promise<{
  prefetchedRelationships: NonNullable<ListViewClientProps['prefetchedRelationships']>
  thumbnails: Record<string, string>
}> {
  const thumbnails = new Map<string, string>()
  const documents: NonNullable<ListViewClientProps['prefetchedRelationships']>['documents'] = {}
  const result = () => ({
    prefetchedRelationships: { documents, locale: req.locale },
    thumbnails: Object.fromEntries(thumbnails),
  })
  const thumbnailField = collectionConfig.flattenedFields.find(
    (field) => field.name === collectionConfig.admin.useAsThumbnail && field.type === 'upload',
  )

  if (!thumbnailField || thumbnailField.type !== 'upload') {
    for (const doc of docs) {
      const id = doc.id

      if (typeof id !== 'number' && typeof id !== 'string') {
        continue
      }
      const src = getDocumentThumbnail({
        doc,
        useAsThumbnail: collectionConfig.admin.useAsThumbnail,
      })

      if (src) {
        thumbnails.set(String(id), src)
      }
    }
    return result()
  }

  const references = new Map<string, Map<number | string, Set<string>>>()
  const relatedCollections = Array.isArray(thumbnailField.relationTo)
    ? thumbnailField.relationTo
    : [thumbnailField.relationTo]

  for (const doc of docs) {
    const documentID = doc.id
    const value = doc[thumbnailField.name]
    const firstValue = Array.isArray(value) ? value[0] : value
    const isPolymorphic =
      firstValue &&
      typeof firstValue === 'object' &&
      'relationTo' in firstValue &&
      'value' in firstValue
    const collectionSlug = isPolymorphic ? firstValue.relationTo : thumbnailField.relationTo
    const relatedValue = isPolymorphic ? firstValue.value : firstValue
    const id =
      relatedValue && typeof relatedValue === 'object' && 'id' in relatedValue
        ? relatedValue.id
        : relatedValue

    if (
      typeof collectionSlug !== 'string' ||
      !relatedCollections.includes(collectionSlug) ||
      (typeof documentID !== 'number' && typeof documentID !== 'string') ||
      (typeof id !== 'number' && typeof id !== 'string')
    ) {
      continue
    }

    const ids = references.get(collectionSlug) ?? new Map<number | string, Set<string>>()
    const documentIDs = ids.get(id) ?? new Set<string>()

    documentIDs.add(String(documentID))
    ids.set(id, documentIDs)
    references.set(collectionSlug, ids)
  }

  await Promise.all(
    [...references].map(async ([collectionSlug, ids]) => {
      const uploadConfig = req.payload.collections[collectionSlug]?.config

      if (!uploadConfig) {
        return
      }
      const result = await req.payload.find({
        collection: collectionSlug,
        depth: 0,
        disableErrors: true,
        draft: true,
        limit: ids.size,
        locale: req.locale,
        overrideAccess: false,
        pagination: false,
        req,
        select: getDocumentThumbnailSelect({
          collectionConfig: uploadConfig,
          select: { [uploadConfig.admin.useAsTitle ?? 'id']: true },
        }),
        user: req.user,
        where: { id: { in: [...ids.keys()] } },
      })

      const relatedDocuments = Object.fromEntries(
        [...ids.keys()].map((id) => [id, false as const]),
      ) as NonNullable<ListViewClientProps['prefetchedRelationships']>['documents'][string]

      documents[collectionSlug] = relatedDocuments
      for (const upload of result.docs) {
        relatedDocuments[upload.id] = upload
        const src = getDocumentThumbnail({ doc: upload })

        if (src) {
          for (const documentID of ids.get(upload.id) ?? []) {
            thumbnails.set(documentID, src)
          }
        }
      }
    }),
  )

  return result()
}
