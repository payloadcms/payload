import type { CollectionConfig } from 'payload'

export const trashEnabledSlug = 'trash-enabled'

export const TrashEnabled: CollectionConfig = {
  slug: trashEnabledSlug,
  admin: {
    useAsTitle: 'title',
  },
  trash: true,
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
  versions: {
    drafts: true,
  },
}
