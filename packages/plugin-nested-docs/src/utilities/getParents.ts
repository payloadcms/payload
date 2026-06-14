import type { CollectionConfig, Document, PayloadRequest } from 'payload'

import type { NestedDocsPluginConfig } from '../types.js'

export const getParents = async (
  req: PayloadRequest,
  pluginConfig: Pick<NestedDocsPluginConfig, 'generateLabel' | 'generateURL' | 'parentFieldSlug'>,
  collection: CollectionConfig,
  doc: Record<string, unknown>,
  docs: Array<Record<string, unknown>> = [],
  visited: Set<string> = new Set(),
): Promise<Document[]> => {
  const parentSlug = pluginConfig?.parentFieldSlug || 'parent'
  const parent = doc[parentSlug]
  let retrievedParent: null | Record<string, unknown> = null

  // Track visited document IDs to detect circular parent chains.
  // Without this, a document whose parent references itself (or
  // forms a cycle A→B→A) causes infinite recursion and a stack
  // overflow on every save.
  if (doc?.id != null) {
    const idKey = String(doc.id)
    if (visited.has(idKey)) {
      return docs
    }
    visited.add(idKey)
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
      if (retrievedParent[parentSlug]) {
        return getParents(req, pluginConfig, collection, retrievedParent, [
          retrievedParent,
          ...docs,
        ], visited)
      }

      return [retrievedParent, ...docs]
    }
  }

  return docs
}
