import type { CollectionConfig } from 'payload'

export const foldersSlug = 'folders'

export const FoldersCollection: CollectionConfig = {
  slug: foldersSlug,
  admin: {
    group: 'Content',
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
  ],
  hierarchy: true,
}
