import type { CollectionConfig, Field } from 'payload'

import type { SanitizedSearchPluginConfig } from '../types.js'
import type { ReindexButtonServerProps } from './ui/ReindexButton/types.js'

import { generateReindexHandler } from '../utilities/generateReindexHandler.js'

// all settings can be overridden by the config
export const generateSearchCollection = (
  pluginConfig: SanitizedSearchPluginConfig,
): CollectionConfig => {
  const searchSlug = pluginConfig?.searchOverrides?.slug || 'search'
  const searchCollections = pluginConfig?.collections || []
  const collectionLabels = pluginConfig?.labels

  const defaultFields: Field[] = [
    {
      name: 'title',
      type: 'text',
      admin: {
        readOnly: true,
      },
      localized: pluginConfig.localize,
    },
    {
      name: 'priority',
      type: 'number',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'doc',
      type: 'relationship',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      index: true,
      maxDepth: 0,
      relationTo: searchCollections,
      required: true,
    },
    {
      name: 'docUrl',
      type: 'ui',
      admin: {
        components: {
          Field: {
            path: '@payloadcms/plugin-search/client#LinkToDoc',
          },
        },
        position: 'sidebar',
      },
    },
  ]

  if (!collectionLabels) {
    throw new Error('collectionLabels is required')
  }

  const newConfig: CollectionConfig = {
    ...(pluginConfig?.searchOverrides || {}),
    slug: searchSlug,
    access: {
      create: (): boolean => false,
      read: (): boolean => true,
      ...(pluginConfig?.searchOverrides?.access || {}),
    },
    admin: {
      components: {
        views: {
          list: {
            actions: [
              {
                path: '@payloadcms/plugin-search/client#ReindexButton',
                serverProps: {
                  collectionLabels,
                  searchCollections,
                  searchSlug,
                } satisfies ReindexButtonServerProps,
              },
            ],
          },
        },
      },
      defaultColumns: ['title'],
      description:
        'This is a collection of automatically created search results. These results are used by the global site search and will be updated automatically as documents in the CMS are created or updated.',
      enableRichTextRelationship: false,
      useAsTitle: 'title',
      ...(pluginConfig?.searchOverrides?.admin || {}),
    },
    endpoints: [
      ...(pluginConfig?.searchOverrides?.endpoints || []),
      {
        handler: generateReindexHandler(pluginConfig),
        method: 'post',
        path: '/reindex',
      },
    ],
    fields:
      pluginConfig?.searchOverrides?.fields &&
      typeof pluginConfig?.searchOverrides?.fields === 'function'
        ? pluginConfig?.searchOverrides.fields({ defaultFields })
        : defaultFields,
    labels: {
      ...(pluginConfig?.searchOverrides?.labels || {
        plural: 'Search Results',
        singular: 'Search Result',
      }),
    },
  }

  return newConfig
}
