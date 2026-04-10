import type { CollectionConfig, Document, PayloadRequest } from 'payload'

import { APIError } from 'payload'

import type { NestedDocsPluginConfig } from '../types.js'

export const getParents = async (
  req: PayloadRequest,
  pluginConfig: Pick<NestedDocsPluginConfig, 'generateLabel' | 'generateURL' | 'parentFieldSlug'>,
  collection: CollectionConfig,
  doc: Record<string, unknown>,
  docs: Array<Record<string, unknown>> = [],
): Promise<Document[]> => {
  const parentSlug = pluginConfig?.parentFieldSlug || 'parent'
  const parent = doc[parentSlug]
  let retrievedParent: null | Record<string, unknown> = null

  if (parent) {
    const parentID = typeof parent === 'object' ? (parent as Record<string, unknown>).id : parent

    // Detect circular parent references to prevent infinite recursion
    if (docs.some((d) => d.id === parentID)) {
      throw new APIError(
        'Circular parent reference detected. A document cannot be its own ancestor.',
      )
    }

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
