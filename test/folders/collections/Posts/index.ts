import type { CollectionConfig } from 'payload'

import { postSlug } from '../../shared.js'

export const Posts: CollectionConfig = {
  slug: postSlug,
  admin: {
    useAsTitle: 'title',
  },
  labels: {
    singular: ({ t }) => t('authentication:account'),
    plural: ({ t }) => t('authentication:account'),
  },
  folders: true,
  trash: true,
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'relatedAutosave',
      type: 'relationship',
      relationTo: 'autosave',
    },
  ],
}
