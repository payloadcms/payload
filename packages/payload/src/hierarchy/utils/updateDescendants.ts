import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { JsonObject, PayloadRequest, SelectIncludeType, TypeWithID } from '../../index.js'

import { adjustDescendantTreePaths } from './adjustDescendantTreePaths.js'

type UpdateDescendantsArgs = {
  batchSize?: number
  collection: SanitizedCollectionConfig
  fieldIsLocalized: boolean
  generatePaths?: boolean
  localeCodes?: string[]
  newParentID: number | string | undefined
  parentDocID: number | string
  parentDocWithLocales: JsonObject & TypeWithID
  parentFieldName: string
  previousParentDocWithLocales: JsonObject & TypeWithID
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
  generatePaths = true,
  localeCodes,
  newParentID,
  parentDocID,
  parentDocWithLocales,
  parentFieldName,
  previousParentDocWithLocales,
  req,
  slugPathFieldName,
  titlePathFieldName,
}: UpdateDescendantsArgs): Promise<void> {
  let currentPage = 1
  let hasNextPage = true

  while (hasNextPage) {
    // Build select fields
    const selectFields: SelectIncludeType = {
      _h_parentTree: true,
    }
    if (generatePaths) {
      selectFields[slugPathFieldName] = true
      selectFields[titlePathFieldName] = true
    }

    const descendantDocsQuery = await req.payload.find({
      collection: collection.slug,
      depth: 0,
      limit: batchSize,
      locale: 'all',
      page: currentPage,
      req,
      select: selectFields,
      where: {
        _h_parentTree: {
          in: [parentDocID],
        },
      },
    })

    const updatePromises: Promise<JsonObject & TypeWithID>[] = []
    descendantDocsQuery.docs.forEach((affectedDoc) => {
      let newTreePaths
      if (generatePaths) {
        newTreePaths = adjustDescendantTreePaths({
          doc: {
            _h_parentTree: affectedDoc._h_parentTree,
            slugPath: affectedDoc[slugPathFieldName],
            titlePath: affectedDoc[titlePathFieldName],
          },
          fieldIsLocalized,
          localeCodes,
          parentDoc: {
            _h_parentTree: parentDocWithLocales._h_parentTree || null,
            slugPath: parentDocWithLocales[slugPathFieldName],
            titlePath: parentDocWithLocales[titlePathFieldName],
          },
          previousParentDoc: {
            _h_parentTree: previousParentDocWithLocales._h_parentTree || null,
            slugPath: previousParentDocWithLocales[slugPathFieldName],
            titlePath: previousParentDocWithLocales[titlePathFieldName],
          },
        })
      }

      const parentDocIndex = affectedDoc._h_parentTree?.indexOf(parentDocID) ?? -1
      const unchangedParentTree =
        parentDocIndex >= 0 ? affectedDoc._h_parentTree.slice(parentDocIndex) : []

      const newParentTree = [...(parentDocWithLocales._h_parentTree || []), ...unchangedParentTree]

      // Build update data
      const updateData: Record<string, any> = {
        _h_depth: newParentTree.length,
        _h_parentTree: newParentTree,
        [parentFieldName]: newParentID,
      }

      if (generatePaths && newTreePaths) {
        updateData[slugPathFieldName] = newTreePaths.slugPath
        updateData[titlePathFieldName] = newTreePaths.titlePath
      }

      updatePromises.push(
        // this pattern has an issue bc it will not run hooks on the affected documents
        // NOTE: using the db directly, no hooks or access control here
        // Using payload.update, we will need to loop over `n` locales and run 1 update per locale and `n` versions will be created
        req.payload.db.updateOne({
          id: affectedDoc.id,
          collection: collection.slug,
          data: updateData,
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
