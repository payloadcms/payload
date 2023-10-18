import type { Plugin } from 'payload/config'

import type { PluginConfig } from './types'

import createBreadcrumbsField from './fields/breadcrumbs'
import createParentField from './fields/parent'
import resaveChildren from './hooks/resaveChildren'
import resaveSelfAfterCreate from './hooks/resaveSelfAfterCreate'
import populateBreadcrumbs from './utilities/populateBreadcrumbs'

const nestedDocs =
  (pluginConfig: PluginConfig): Plugin =>
  (config) => ({
    ...config,
    collections: (config.collections || []).map((collection) => {
      if (pluginConfig.collections.indexOf(collection.slug) > -1) {
        const fields = [...(collection?.fields || [])]

        if (!pluginConfig.parentFieldSlug) {
          fields.push(createParentField(collection.slug))
        }

        if (!pluginConfig.breadcrumbsFieldSlug) {
          fields.push(createBreadcrumbsField(collection.slug))
        }

        return {
          ...collection,
          hooks: {
            ...(collection.hooks || {}),
            beforeChange: [
              async ({ req, data, originalDoc }) =>
                populateBreadcrumbs(req, pluginConfig, collection, data, originalDoc),
              ...(collection?.hooks?.beforeChange || []),
            ],
            afterChange: [
              resaveChildren(pluginConfig, collection),
              resaveSelfAfterCreate(collection),
              ...(collection?.hooks?.afterChange || []),
            ],
          },
          fields,
        }
      }

      return collection
    }),
  })

export default nestedDocs
