import type { CollectionConfig } from 'payload'

import deepMerge from 'deepmerge'

import type { SearchPluginConfig } from '../types.js'

import { LinkToDoc } from './ui/index.js'

// all settings can be overridden by the config
export const generateSearchCollection = (pluginConfig: SearchPluginConfig): CollectionConfig =>
  deepMerge(
    {
      slug: 'search',
      access: {
        create: (): boolean => false,
        read: (): boolean => true,
      },
      admin: {
        defaultColumns: ['title'],
        description:
          'This is a collection of automatically created search results. These results are used by the global site search and will be updated automatically as documents in the CMS are created or updated.',
        enableRichTextRelationship: false,
        useAsTitle: 'title',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          admin: {
            readOnly: true,
          },
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
          relationTo: pluginConfig?.collections || [],
          required: true,
        },
        {
          name: 'docUrl',
          type: 'ui',
          admin: {
            components: {
              Field: LinkToDoc,
            },
            position: 'sidebar',
          },
        },
      ],
      labels: {
        plural: 'Search Results',
        singular: 'Search Result',
      },
    },
    pluginConfig?.searchOverrides || {},
  )
