import type { CollectionConfig } from 'payload'

import type { NestedDocsPluginConfig } from '../types.js'

import { formatBreadcrumb } from './formatBreadcrumb.js'
import { getParents } from './getParents.js'

export const populateBreadcrumbs = async (
  req: any,
  pluginConfig: NestedDocsPluginConfig,
  collection: CollectionConfig,
  data: any,
  originalDoc?: any,
): Promise<any> => {
  const newData = data

  const breadcrumbDocs = [
    ...(await getParents(req, pluginConfig, collection, {
      ...originalDoc,
      ...data,
    })),
  ]

  console.log(data)

  const currentDoc = {
    ...originalDoc,
    ...data,
    id: originalDoc?.id ?? data?.id,
  }

  breadcrumbDocs.push(currentDoc)

  const breadcrumbs = breadcrumbDocs.map((_, i) =>
    formatBreadcrumb(pluginConfig, collection, breadcrumbDocs.slice(0, i + 1)),
  )

  console.log('returning', breadcrumbs)

  return {
    ...newData,
    [pluginConfig?.breadcrumbsFieldSlug || 'breadcrumbs']: breadcrumbs,
  }
}
