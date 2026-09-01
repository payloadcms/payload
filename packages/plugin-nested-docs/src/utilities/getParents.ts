import type { CollectionConfig, Document, PayloadRequest } from 'payload'

import type { NestedDocsPluginConfig } from '../types.js'

const getVisitableID = (doc: Record<string, unknown>): string | undefined =>
  typeof doc.id === 'string' || typeof doc.id === 'number' ? String(doc.id) : undefined

export const getParents = async (
  req: PayloadRequest,
  pluginConfig: Pick<NestedDocsPluginConfig, 'generateLabel' | 'generateURL' | 'parentFieldSlug'>,
  collection: CollectionConfig,
  doc: Record<string, unknown>,
  docs: Array<Record<string, unknown>> = [],
  /**
   * IDs of the documents already traversed, used to stop the traversal when a document points at
   * an ancestor of itself. Populated by the recursive calls - callers should not pass this.
   */
  visitedIDs: Set<string> = new Set(),
): Promise<Document[]> => {
  const parentSlug = pluginConfig?.parentFieldSlug || 'parent'
  const parent = doc[parentSlug]
  let retrievedParent: null | Record<string, unknown> = null

  const docID = getVisitableID(doc)

  if (docID) {
    visitedIDs.add(docID)
  }

  if (parent) {
    // If not auto-populated, and we have an ID
    if (typeof parent === 'string' || typeof parent === 'number') {
      retrievedParent = await req.payload.findByID({
        id: parent,
        collection: collection.slug,
        depth: 0,
        disableErrors: true,
        req,
      })
    }

    // If auto-populated
    if (typeof parent === 'object') {
      retrievedParent = parent as Record<string, unknown>
    }

    if (retrievedParent) {
      const retrievedParentID = getVisitableID(retrievedParent)

      // Without this the traversal of a circular hierarchy never terminates, querying the database
      // once per iteration until the request runs out of memory. `parentFilterOptions` rejects
      // cycles created through the API, but they can still reach the database through migrations,
      // direct adapter writes, or a parent field that overrides the plugin's `filterOptions`.
      if (retrievedParentID && visitedIDs.has(retrievedParentID)) {
        req.payload.logger.warn(
          `Nested Docs plugin detected a circular parent relationship in the "${collection.slug}" collection. Breadcrumb traversal stopped at the document with ID ${retrievedParentID}.`,
        )

        return docs
      }

      if (retrievedParent[parentSlug]) {
        return getParents(
          req,
          pluginConfig,
          collection,
          retrievedParent,
          [retrievedParent, ...docs],
          visitedIDs,
        )
      }

      return [retrievedParent, ...docs]
    }
  }

  return docs
}
