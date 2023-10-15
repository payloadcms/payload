import type { CollectionConfig } from 'payload/types'

import type { PluginConfig } from '../types'
import formatBreadcrumb from './formatBreadcrumb'
import getParents from './getParents'

const populateBreadcrumbs = async (
  req: any,
  pluginConfig: PluginConfig,
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
    {
      ...originalDoc,
      ...data,
      id: originalDoc?.id,
    },
  ]

  const breadcrumbs = breadcrumbDocs.map((_, i) =>
    formatBreadcrumb(pluginConfig, collection, breadcrumbDocs.slice(0, i + 1)),
  ) // eslint-disable-line function-paren-newline

  return {
    ...newData,
    [pluginConfig?.breadcrumbsFieldSlug || 'breadcrumbs']: breadcrumbs,
  }
}

export default populateBreadcrumbs
