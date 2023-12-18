import type { CollectionConfig } from 'payload/types'

import type { PluginConfig } from '../types'

const getParents = async (
  req: any,
  pluginConfig: PluginConfig,
  collection: CollectionConfig,
  doc: Record<string, unknown>,
  docs: Array<Record<string, unknown>> = [],
): Promise<Array<Record<string, unknown>>> => {
  const parent = doc[pluginConfig?.parentFieldSlug || 'parent']
  let retrievedParent

  if (parent) {
    // If not auto-populated, and we have an ID
    if (typeof parent === 'string' || typeof parent === 'number') {
      retrievedParent = await req.payload.findByID({
        req,
        id: parent,
        collection: collection.slug,
        depth: 0,
        disableErrors: true,
      })
    }

    // If auto-populated
    if (typeof parent === 'object') {
      retrievedParent = parent
    }

    if (retrievedParent) {
      if (retrievedParent.parent) {
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

export default getParents
