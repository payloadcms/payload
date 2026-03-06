import type { CollectionConfig } from 'payload'

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
  ],
  folders: true,
  labels: {
    plural: ({ t }) => t('general:documents'),
    singular: ({ t }) => t('general:document'),
  },
}
