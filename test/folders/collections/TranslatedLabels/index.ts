import type { CollectionConfig } from 'payload'

import { createFolderField } from 'payload'

import { folderSlug } from '../../shared.js'

export const TranslatedLabels: CollectionConfig = {
  slug: 'translated-labels',
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    createFolderField({ folderSlug }),
  ],
  labels: {
    plural: ({ t }) => t('general:documents'),
    singular: ({ t }) => t('general:document'),
  },
}
