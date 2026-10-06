import type { CollectionConfig, Document, PayloadRequest } from 'payload'

import { hasDraftsEnabled } from 'payload/shared'

import type { NestedDocsPluginConfig } from '../types.js'

export const getParents = async (
  req: PayloadRequest,
  pluginConfig: Pick<NestedDocsPluginConfig, 'generateLabel' | 'generateURL' | 'parentFieldSlug'>,
  collection: CollectionConfig,
  doc: Record<string, unknown>,
  docs: Array<Record<string, unknown>> = [],
  version?: 'latest' | 'published',
): Promise<Document[]> => {
  const parentVersion = hasDraftsEnabled(collection)
    ? (version ?? (doc._status === 'draft' ? 'latest' : 'published'))
    : 'published'

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
        overrideAccess: true,
        req,
        version: parentVersion,
      })
    }

    // If auto-populated
    if (typeof parent === 'object') {
      retrievedParent = parent as Record<string, unknown>
    }

    if (retrievedParent) {
      if (retrievedParent[parentSlug]) {
        return getParents(
          req,
          pluginConfig,
          collection,
          retrievedParent,
          [retrievedParent, ...docs],
          parentVersion,
        )
      }

      return [retrievedParent, ...docs]
    }
  }

  return docs
}
