import type { Plugin } from 'payload/config'
import type { SingleRelationshipField } from 'payload/dist/fields/config/types'

import type { PluginConfig } from './types'

import createBreadcrumbsField from './fields/breadcrumbs'
import createParentField from './fields/parent'
import parentFilterOptions from './fields/parentFilterOptions'
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
        ) as SingleRelationshipField

        const defaultFilterOptions = parentFilterOptions(pluginConfig?.breadcrumbsFieldSlug)

        if (existingParentField) {
          if (!existingParentField.filterOptions) {
            existingParentField.filterOptions = defaultFilterOptions
          }
        }

        if (!existingParentField && !pluginConfig.parentFieldSlug) {
          const defaultParentField = createParentField(collection.slug)
          defaultParentField.filterOptions = defaultFilterOptions
          fields.push(defaultParentField)
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
