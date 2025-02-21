import type { CollectionConfig } from 'payload'

import type { Breadcrumb, NestedDocsPluginConfig } from '../types.js'

export const formatBreadcrumb = (
  pluginConfig: NestedDocsPluginConfig,
  collection: CollectionConfig,
  docs: Array<Record<string, unknown>>,
): Breadcrumb => {
  let url: string | undefined = undefined
  let label: string

  const lastDoc = docs[docs.length - 1]

  if (typeof pluginConfig?.generateURL === 'function') {
    url = pluginConfig.generateURL(docs, lastDoc)
  }

  if (typeof pluginConfig?.generateLabel === 'function') {
    label = pluginConfig.generateLabel(docs, lastDoc)
  } else {
    const useAsTitle = collection?.admin?.useAsTitle || 'id'

    // Fallback to ID if useAsTitle field is not filled (e.g., optional fields).
    label = (lastDoc[useAsTitle] ?? lastDoc.id) as string
  }

  return {
    doc: lastDoc.id as string,
    label,
    url,
  }
}
