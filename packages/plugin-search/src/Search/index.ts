import type { CollectionConfig } from 'payload/types'

import deepMerge from 'ts-deepmerge'

import type { SearchConfig } from '../types'

import { LinkToDoc } from './ui'

// all settings can be overridden by the config
export const generateSearchCollection = (searchConfig: SearchConfig): CollectionConfig =>
  deepMerge(
    {
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
          admin: {
            readOnly: true,
          },
          type: 'text',
        },
        {
          name: 'priority',
          admin: {
            position: 'sidebar',
          },
          type: 'number',
        },
        {
          name: 'doc',
          admin: {
            position: 'sidebar',
            readOnly: true,
          },
          index: true,
          maxDepth: 0,
          relationTo: searchConfig?.collections || [],
          required: true,
          type: 'relationship',
        },
        {
          name: 'docUrl',
          admin: {
            components: {
              Field: LinkToDoc,
            },
            position: 'sidebar',
          },
          type: 'ui',
        },
      ],
      labels: {
        plural: 'Search Results',
        singular: 'Search Result',
      },
      slug: 'search',
    },
    searchConfig?.searchOverrides || {},
  )
