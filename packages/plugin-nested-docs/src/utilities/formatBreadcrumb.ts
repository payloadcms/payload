import type { CollectionConfig } from 'payload'

import type { Breadcrumb, NestedDocsPluginConfig } from '../types.js'

export const formatBreadcrumb = ({
  breadcrumb,
  collection,
  docs,
  pluginConfig,
}: {
  /**
   * Existing breadcrumb, if any, to base the new breadcrumb on.
   * This ensures that row IDs are maintained across updates, etc.
   */
  breadcrumb?: Breadcrumb
  collection: CollectionConfig
  docs: Array<Record<string, unknown>>
  pluginConfig: NestedDocsPluginConfig
}): Breadcrumb => {
  let url: string | undefined = undefined
  let label: string

  const lastDoc = docs[docs.length - 1]!

  if (typeof pluginConfig?.generateURL === 'function') {
    url = pluginConfig.generateURL(docs, lastDoc)
  }

  if (typeof pluginConfig?.generateLabel === 'function') {
    label = pluginConfig.generateLabel(docs, lastDoc)
  } else {
    const title = collection.admin?.useAsTitle ? lastDoc[collection.admin.useAsTitle] : ''

    label = typeof title === 'string' || typeof title === 'number' ? String(title) : ''
  }

  return {
    ...(breadcrumb || {}),
    doc: lastDoc.id as string,
    label,
    url,
  }
}
