import { CollectionConfig } from 'payload/types';
import { SearchConfig } from '../types';
import deepMerge from '../utilities/deepMerge';

// all settings can be overridden by the config
export const generateSearchCollection = (searchConfig: SearchConfig): CollectionConfig => deepMerge({
  slug: searchConfig?.searchOverrides?.slug || 'search',
  labels: {
    singular: 'Search Result',
    plural: 'Search Results',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: [
      'title',
    ],
    description: 'This is a collection of automatically created search results. These results are used by the global site search and will be updated automatically as documents in the CMS are created or updated.',
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
    },
    {
      name: 'priority',
      type: 'number',
      admin: {
        position: 'sidebar'
      }
    },
    {
      name: 'doc',
      type: 'relationship',
      relationTo: searchConfig.collections || [],
      required: true,
      index: true,
      maxDepth: 0,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'priority',
      type: 'number',
      admin: {
        position: 'sidebar'
      }
    },
  ],
}, searchConfig.searchOverrides || {});
