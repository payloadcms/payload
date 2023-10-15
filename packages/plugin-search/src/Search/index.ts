import type { CollectionConfig } from 'payload/types'
import deepMerge from 'ts-deepmerge'

import type { SearchConfig } from '../types'
import { LinkToDoc } from './ui'

// all settings can be overridden by the config
export const generateSearchCollection = (searchConfig: SearchConfig): CollectionConfig =>
  deepMerge(
    {
      slug: 'search',
      labels: {
        singular: 'Search Result',
        plural: 'Search Results',
      },
      admin: {
        useAsTitle: 'title',
        defaultColumns: ['title'],
        description:
          'This is a collection of automatically created search results. These results are used by the global site search and will be updated automatically as documents in the CMS are created or updated.',
        enableRichTextRelationship: false,
      },
      access: {
        read: (): boolean => true,
        create: (): boolean => false,
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
          relationTo: searchConfig?.collections || [],
          required: true,
          index: true,
          maxDepth: 0,
          admin: {
            readOnly: true,
            position: 'sidebar',
          },
        },
        {
          name: 'docUrl',
          type: 'ui',
          admin: {
            position: 'sidebar',
            components: {
              Field: LinkToDoc,
            },
          },
        },
      ],
    },
    searchConfig?.searchOverrides || {},
  )
