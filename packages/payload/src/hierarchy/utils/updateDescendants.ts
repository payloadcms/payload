import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { JsonObject, PayloadRequest, TypeWithID } from '../../index.js'

import { adjustDescendantTreePaths } from './adjustDescendantTreePaths.js'

type UpdateDescendantsArgs = {
  batchSize?: number
  collection: SanitizedCollectionConfig
  fieldIsLocalized: boolean
  localeCodes?: string[]
  newParentID: number | string | undefined
  parentDocID: number | string
  parentDocWithLocales: JsonObject & TypeWithID
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
  fieldIsLocalized,
  localeCodes,
  newParentID,
  parentDocID,
  parentDocWithLocales,
  parentFieldName,
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
        doc: {
          _parentTree: affectedDoc._parentTree,
          slugPath: affectedDoc[slugPathFieldName],
          titlePath: affectedDoc[titlePathFieldName],
        },
        fieldIsLocalized,
        localeCodes,
        parentDoc: {
          _parentTree: parentDocWithLocales._parentTree || null,
          slugPath: parentDocWithLocales[slugPathFieldName],
          titlePath: parentDocWithLocales[titlePathFieldName],
        },
      })

      const parentDocIndex = affectedDoc._parentTree?.indexOf(parentDocID) ?? -1
      const unchangedParentTree =
        parentDocIndex >= 0 ? affectedDoc._parentTree.slice(parentDocIndex) : []

      updatePromises.push(
        // this pattern has an issue bc it will not run hooks on the affected documents
        // NOTE: using the db directly, no hooks or access control here
        // Using payload.update, we will need to loop over `n` locales and run 1 update per locale and `n` versions will be created
        req.payload.db.updateOne({
          id: affectedDoc.id,
          collection: collection.slug,
          data: {
            _parentTree: [...(parentDocWithLocales._parentTree || []), ...unchangedParentTree],
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
