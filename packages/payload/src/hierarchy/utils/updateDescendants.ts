import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { JsonObject, PayloadRequest, SelectIncludeType, TypeWithID } from '../../index.js'

import { hasDraftsEnabled } from '../../utilities/getVersionsConfig.js'
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
 *
 * Captures all descendant IDs upfront to prevent race conditions where
 * concurrent updates could cause pagination to miss or duplicate documents.
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
  // Step 1: Collect all descendant IDs upfront to prevent race conditions
  const descendantIDs: Array<number | string> = []
  let currentPage = 1
  let hasNextPage = true

  while (hasNextPage) {
    const idsQuery = await req.payload.find({
      collection: collection.slug,
      depth: 0,
      limit: 1000,
      locale: 'all',
      page: currentPage,
      req,
      select: { id: true },
      where: {
        _h_parentTree: {
          in: [parentDocID],
        },
      },
    })

    descendantIDs.push(...idsQuery.docs.map((doc) => doc.id))
    hasNextPage = idsQuery.hasNextPage
    currentPage++
  }

  // Step 2: Process descendants in batches by ID
  for (let i = 0; i < descendantIDs.length; i += batchSize) {
    const batchIDs = descendantIDs.slice(i, i + batchSize)

    // Build select fields
    const selectFields: SelectIncludeType = {
      _h_parentTree: true,
    }
    if (generatePaths) {
      selectFields[slugPathFieldName] = true
      selectFields[titlePathFieldName] = true
    }
    // Need _status to detect published documents with drafts
    if (hasDraftsEnabled(collection)) {
      selectFields._status = true
    }

    const descendantDocsQuery = await req.payload.find({
      collection: collection.slug,
      depth: 0,
      limit: batchSize,
      locale: 'all',
      req,
      select: selectFields,
      where: {
        id: {
          in: batchIDs,
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

      // For localized fields, we need to update each locale separately
      // because payload.update() expects a single locale at a time
      if (fieldIsLocalized && localeCodes) {
        for (const locale of localeCodes) {
          // Build update data for this specific locale
          // NOTE: We do NOT update the parent field - descendants keep their existing parent!
          // We only update the tree metadata (_h_parentTree, _h_depth, paths)
          const updateData: Record<string, any> = {
            _h_depth: newParentTree.length,
            _h_parentTree: newParentTree,
          }

          if (generatePaths && newTreePaths) {
            updateData[slugPathFieldName] = (newTreePaths.slugPath as Record<string, string>)[
              locale
            ]
            updateData[titlePathFieldName] = (newTreePaths.titlePath as Record<string, string>)[
              locale
            ]
          }

          updatePromises.push(
            req.payload.update({
              id: affectedDoc.id,
              collection: collection.slug,
              data: updateData,
              depth: 0,
              locale,
              overrideAccess: true,
              req,
            }),
          )
        }
      } else {
        // Non-localized: single update
        // NOTE: We do NOT update the parent field - descendants keep their existing parent!
        // We only update the tree metadata (_h_parentTree, _h_depth, paths)
        const updateData: Record<string, any> = {
          _h_depth: newParentTree.length,
          _h_parentTree: newParentTree,
        }

        if (generatePaths && newTreePaths) {
          updateData[slugPathFieldName] = newTreePaths.slugPath
          updateData[titlePathFieldName] = newTreePaths.titlePath
        }

        updatePromises.push(
          req.payload.update({
            id: affectedDoc.id,
            collection: collection.slug,
            data: updateData,
            depth: 0,
            overrideAccess: true,
            req,
          }),
        )
      }
    })

    await Promise.all(updatePromises)
  }
}
