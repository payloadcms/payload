import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { JsonObject, PayloadRequest, TypeWithID } from '../../index.js'

import { adjustDescendantTreePaths } from './adjustDescendantTreePaths.js'

type UpdateDescendantsArgs = {
  batchSize?: number
  collection: SanitizedCollectionConfig
  documentAfterUpdate: JsonObject & TypeWithID
  fieldIsLocalized: boolean
  localeCodes?: string[]
  newParentID: number | string | undefined
  parentDocID: number | string
  parentFieldName: string
  previousDocWithLocales: JsonObject & TypeWithID
  req: PayloadRequest
  slugPathFieldName: string
  titlePathFieldName: string
}

/**
 * Updates all descendants of a document when its parent or title changes.
 * Processes descendants in batches to handle unlimited tree sizes.
 */
export async function updateDescendants({
  batchSize = 100,
  collection,
  documentAfterUpdate,
  fieldIsLocalized,
  localeCodes,
  newParentID,
  parentDocID,
  parentFieldName,
  previousDocWithLocales,
  req,
  slugPathFieldName,
  titlePathFieldName,
}: UpdateDescendantsArgs): Promise<void> {
  let currentPage = 1
  let hasNextPage = true

  while (hasNextPage) {
    const descendantDocsQuery = await req.payload.find({
      collection: collection.slug,
      depth: 0,
      limit: batchSize,
      locale: 'all',
      page: currentPage,
      req,
      select: {
        _parentTree: true,
        [slugPathFieldName]: true,
        [titlePathFieldName]: true,
      },
      where: {
        _parentTree: {
          in: [parentDocID],
        },
      },
    })

    const updatePromises: Promise<JsonObject & TypeWithID>[] = []
    descendantDocsQuery.docs.forEach((affectedDoc) => {
      const newTreePaths = adjustDescendantTreePaths({
        affectedDoc,
        fieldIsLocalized,
        localeCodes,
        newDoc: documentAfterUpdate,
        previousDocWithLocales,
        slugPathFieldName,
        titlePathFieldName,
      })

      // Find the index of parentDocID in affectedDoc's parent tree
      const docIndex = affectedDoc._parentTree?.indexOf(parentDocID) ?? -1
      const descendants = docIndex >= 0 ? affectedDoc._parentTree.slice(docIndex) : []

      updatePromises.push(
        // this pattern has an issue bc it will not run hooks on the affected documents
        // NOTE: using the db directly, no hooks or access control here
        // Using payload.update, we will need to loop over `n` locales and run 1 update per locale and `n` versions will be created
        req.payload.db.updateOne({
          id: affectedDoc.id,
          collection: collection.slug,
          data: {
            _parentTree: [...(documentAfterUpdate._parentTree || []), ...descendants],
            [parentFieldName]: newParentID,
            [slugPathFieldName]: newTreePaths.slugPath,
            [titlePathFieldName]: newTreePaths.titlePath,
          },
          locale: 'all',
          req,
        }),
      )
    })

    await Promise.all(updatePromises)

    hasNextPage = descendantDocsQuery.hasNextPage
    currentPage++
  }
}
