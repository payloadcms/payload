/**
 * afterRead Hook Responsibilities:
 * - Automatically compute and attach _h_slugPath and _h_titlePath to documents
 * - Use cached ancestors to optimize queries when reading multiple documents
 * - Only computes when explicitly requested via:
 *   1. context.computeHierarchyPaths flag
 *   2. ?computeHierarchyPaths=true query param
 *   3. Selecting path fields in query (select parameter)
 */

import type { CollectionAfterReadHook, PayloadRequest } from '../../index.js'

import { computePaths } from '../utils/computePaths.js'
import { findUseAsTitleField } from '../utils/findUseAsTitle.js'

/**
 * Checks if path fields are being selected in the query
 */
function isPathFieldSelected(
  req: PayloadRequest,
  slugPathFieldName: string,
  titlePathFieldName: string,
): boolean {
  // Check query.select parameter (REST API)
  const selectParam = req.query?.select

  if (selectParam) {
    if (typeof selectParam === 'string') {
      const selectedFields = selectParam.split(',').map((f) => f.trim())
      return (
        selectedFields.includes(slugPathFieldName) || selectedFields.includes(titlePathFieldName)
      )
    }
    // Could be an array or object depending on query parser
    if (Array.isArray(selectParam)) {
      return selectParam.includes(slugPathFieldName) || selectParam.includes(titlePathFieldName)
    }
  }

  return false
}

type Args = {
  /**
   * The name of the field that contains the parent document ID
   */
  parentFieldName: string
  /**
   * The name of the field to populate with the slug-based path
   */
  slugPathFieldName: string
  /**
   * The name of the field to populate with the title-based path
   */
  titlePathFieldName: string
}

export const hierarchyCollectionAfterRead =
  ({ parentFieldName, slugPathFieldName, titlePathFieldName }: Args): CollectionAfterReadHook =>
  async ({ collection, context, doc, req }) => {
    // Skip if deleting
    if (context?.isDeleting) {
      return doc
    }

    // Determine if paths should be computed
    const shouldComputePaths =
      context?.computeHierarchyPaths === true || // Explicit flag
      req.query?.computeHierarchyPaths === 'true' || // Query parameter
      isPathFieldSelected(req, slugPathFieldName, titlePathFieldName) // Field selection detection

    if (!shouldComputePaths) {
      return doc
    }

    try {
      const { localized: isTitleLocalized } = findUseAsTitleField(collection)

      const { slugPath, titlePath } = await computePaths({
        collection,
        doc,
        draft: doc._status === 'draft',
        locale:
          isTitleLocalized && req.locale === 'all'
            ? 'all'
            : req.locale === 'all'
              ? undefined
              : req.locale || undefined,
        parentFieldName,
        req,
        slugPathFieldName,
        titlePathFieldName,
      })

      // Attach computed paths to document using configured field names
      doc[slugPathFieldName] = slugPath
      doc[titlePathFieldName] = titlePath
    } catch (error) {
      // If path computation fails, log but don't break the document read
      // eslint-disable-next-line no-console
      console.error(`Failed to compute hierarchy paths for document ${doc.id}:`, error)
    }

    return doc
  }
