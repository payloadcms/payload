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

        const existingBreadcrumbField = collection.fields.find(
          (field) =>
            'name' in field && field.name === (pluginConfig?.breadcrumbsFieldSlug || 'breadcrumbs'),
        )

        const existingParentField = collection.fields.find(
          (field) => 'name' in field && field.name === (pluginConfig?.parentFieldSlug || 'parent'),
        )

        if (!existingParentField && !pluginConfig.parentFieldSlug) {
          fields.push(createParentField(collection.slug))
        }

        if (!existingBreadcrumbField && !pluginConfig.breadcrumbsFieldSlug) {
          fields.push(createBreadcrumbsField(collection.slug))
        }

        return {
          ...collection,
          fields,
          hooks: {
            ...(collection.hooks || {}),
            afterChange: [
              resaveChildren(pluginConfig, collection),
              resaveSelfAfterCreate(pluginConfig, collection),
              ...(collection?.hooks?.afterChange || []),
            ],
            beforeChange: [
              async ({ data, originalDoc, req }) =>
                populateBreadcrumbs(req, pluginConfig, collection, data, originalDoc),
              ...(collection?.hooks?.beforeChange || []),
            ],
          },
        }
      }

      return collection
    }),
  })

export default nestedDocs
