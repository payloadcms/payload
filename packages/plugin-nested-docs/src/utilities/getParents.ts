import type { CollectionConfig, PayloadRequest } from 'payload/types'

import type { PluginConfig } from '../types.js'

export const getParents = async (
  req: PayloadRequest,
  pluginConfig: PluginConfig,
  collection: CollectionConfig,
  doc: Record<string, unknown>,
  docs: Array<Record<string, unknown>> = [],
): Promise<Array<Record<string, unknown>>> => {
  const parentSlug = pluginConfig?.parentFieldSlug || 'parent'
  const parent = doc?.[parentSlug]
  let retrievedParent

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
      retrievedParent = parent
    }

    if (retrievedParent) {
      if (retrievedParent?.[parentSlug]) {
        return getParents(
          req,
          pluginConfig,
          collection,
          retrievedParent as unknown as Record<string, unknown>,
          [retrievedParent as unknown as Record<string, unknown>, ...docs],
        )
      }

      return [retrievedParent as unknown as Record<string, unknown>, ...docs]
    }
  }

  return docs
}
