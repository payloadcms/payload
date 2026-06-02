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
      // @ts-expect-error - translations are not typed in plugins yet
      label: ({ t }) => t('plugin-search:resultTitle'),
      localized: pluginConfig.localize,
    },
    {
      name: 'priority',
      type: 'number',
      admin: {
        position: 'sidebar',
      },
      // @ts-expect-error - translations are not typed in plugins yet
      label: ({ t }) => t('plugin-search:resultPriority'),
    },
    {
      name: 'doc',
      type: 'relationship',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      index: true,
      // @ts-expect-error - translations are not typed in plugins yet
      label: ({ t }) => t('plugin-search:resultDocument'),
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
      // @ts-expect-error - translations are not typed in plugins yet
      label: ({ t }) => t('plugin-search:resultDocumentUrl'),
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
      // @ts-expect-error - translations are not typed in plugins yet
      description: ({ t }) => t('plugin-search:searchResultsDescription'),
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
        // @ts-expect-error - translations are not typed in plugins yet
        plural: ({ t }): string => t('plugin-search:searchResults'),
        // @ts-expect-error - translations are not typed in plugins yet
        singular: ({ t }): string => t('plugin-search:searchResult'),
      }),
    },
  }

  return newConfig
}
