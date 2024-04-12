import type { CollectionConfig } from 'payload/types'

import type { PluginConfig } from '../types.js'

/**
 * Helper function to determine if the breadcrumbs should be populated
 *
 * @param pluginConfig - The plugin configuration
 * @param data - The data to be saved
 * @param collection - The collection configuration
 * @param originalDoc - The original document
 */
export const shouldPopulateBreadcrumbs = (
  pluginConfig: PluginConfig,
  data: any,
  collection: CollectionConfig,
  originalDoc?: any,
) => {
  // the originalDoc is not present, so we should populate the breadcrumbs
  if (!originalDoc) return true

  // if it's a nested collection, we should populate the breadcrumbs
  if (data?.hierarchy && !Array.isArray(data?.hierarchy)) {
    return true
  }

  const collectionKey = collection?.admin?.useAsTitle || 'id'

  // if the collection key is different, we should populate the breadcrumbs
  if (data?.[collectionKey] !== originalDoc?.[collectionKey]) {
    return true
  }

  const urlKey = pluginConfig?.urlFieldSlug

  // if the urlKey is set via PluginConfig.urlFieldSlug and the data is different,
  // we should populate the breadcrumbs
  if (
    urlKey &&
    typeof pluginConfig.generateURL === 'function' &&
    data?.[urlKey] === originalDoc?.[urlKey]
  )
    return false

  // has no custom fields for url, so we should populate the breadcrumbs
  return true
}
