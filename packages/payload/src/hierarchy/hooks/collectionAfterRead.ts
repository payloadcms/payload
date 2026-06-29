/**
 * afterRead Hook Responsibilities:
 * - Automatically compute and attach _h_slugPath and _h_titlePath to documents
 * - Use cached ancestors to optimize queries when reading multiple documents
 * - Only computes when explicitly requested via:
 *   1. context.hierarchy.computePaths flag
 *   2. ?hierarchy[computePaths]=true query param
 *   3. Selecting path fields in query (select parameter)
 */

import type { CollectionAfterReadHook, PayloadRequest } from '../../index.js'

import { computePaths } from '../utils/computePaths.js'

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
   * When true, always compute paths on every read (used when usePathAsTitle is enabled
   * so the full path is available wherever the document is used — including as the text
   * shown in relationship pills populated via depth). When false (default), paths are
   * only computed on demand via select, context flag, or query param.
   */
  alwaysComputePaths?: boolean
  /**
   * Whether the title field is localized. Passed explicitly to avoid re-deriving from
   * collection config (which may have useAsTitle overridden to the virtual path field
   * when usePathAsTitle is enabled).
   */
  isTitleLocalized: boolean
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
  ({
    alwaysComputePaths = false,
    isTitleLocalized,
    parentFieldName,
    slugPathFieldName,
    titlePathFieldName,
  }: Args): CollectionAfterReadHook =>
  async ({ collection, context, doc, req }) => {
    // Skip if deleting
    if (context?.isDeleting) {
      return doc
    }

    const hierarchyContext =
      context?.hierarchy && typeof context.hierarchy === 'object'
        ? (context.hierarchy as { computePaths?: boolean; computePathsViaSelect?: boolean })
        : undefined

    const hierarchyQuery =
      req.query?.hierarchy && typeof req.query.hierarchy === 'object'
        ? (req.query.hierarchy as { computePaths?: string | unknown })
        : undefined

    const hasHierarchyComputePathsQuery =
      hierarchyQuery?.computePaths === true || hierarchyQuery?.computePaths === 'true'

    // Determine if paths should be computed
    const shouldComputePaths =
      alwaysComputePaths || // Always on when usePathAsTitle is enabled
      hierarchyContext?.computePaths === true || // Explicit namespaced context flag
      hierarchyContext?.computePathsViaSelect === true || // Flag from beforeOperation (select-triggered)
      hasHierarchyComputePathsQuery || // Namespaced query parameter
      isPathFieldSelected(req, slugPathFieldName, titlePathFieldName) // Field selection detection

    if (!shouldComputePaths) {
      return doc
    }

    try {
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

    // Strip auto-added fields that were only included for path computation
    const autoAddedFields = context?.hierarchyAutoSelectedFields as string[] | undefined
    if (autoAddedFields && autoAddedFields.length > 0) {
      for (const fieldName of autoAddedFields) {
        delete doc[fieldName]
      }
    }

    return doc
  }
