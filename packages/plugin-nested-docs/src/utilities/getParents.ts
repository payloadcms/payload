import type { CollectionConfig, PayloadRequest } from 'payload'

import type { NestedDocsPluginConfig } from '../types.js'

export const getParents = async (
  req: PayloadRequest,
  pluginConfig: NestedDocsPluginConfig,
  collection: CollectionConfig,
  doc: Record<string, unknown>,
  docs: Array<Record<string, unknown>> = [],
): Promise<Array<Record<string, unknown>>> => {
  const parentSlug = pluginConfig?.parentFieldSlug || 'parent'
  const parent = doc[parentSlug]
  let retrievedParent: null | Record<string, unknown> = null

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
        ])
      }

      return [retrievedParent, ...docs]
    }
  }

  return docs
}
