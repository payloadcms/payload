import type { CollectionConfig, PayloadRequest } from 'payload/types'

import type { PluginConfig } from '../types.js'

import { formatBreadcrumb } from './formatBreadcrumb.js'
import { getParents } from './getParents.js'
import { shouldPopulateBreadcrumbs } from './shouldPopulateBreadcrumbs.js'

export const populateBreadcrumbs = async (
  req: PayloadRequest,
  pluginConfig: PluginConfig,
  collection: CollectionConfig,
  data: any,
  originalDoc?: any,
): Promise<unknown> => {
  if (!shouldPopulateBreadcrumbs(pluginConfig, data, collection, originalDoc)) {
    return data
  }

  const newData = data
  const breadcrumbDocs = [
    ...(await getParents(req, pluginConfig, collection, {
      ...originalDoc,
      ...data,
    })),
  ]

  const currentDocBreadcrumb = {
    ...originalDoc,
    ...data,
  }

  if (originalDoc?.id) {
    currentDocBreadcrumb.id = originalDoc?.id
  }

  breadcrumbDocs.push(currentDocBreadcrumb)

  const breadcrumbs = breadcrumbDocs.map((_, i) =>
    formatBreadcrumb(pluginConfig, collection, breadcrumbDocs.slice(0, i + 1)),
  )

  return {
    ...newData,
    [pluginConfig?.breadcrumbsFieldSlug || 'breadcrumbs']: breadcrumbs,
  }
}
