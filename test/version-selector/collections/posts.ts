import type { CollectionConfig } from 'payload'

import { lexicalEditor, RelationshipFeature } from '@payloadcms/richtext-lexical'

import { draftPostsSlug } from '../slugs.js'

export const Posts: CollectionConfig = {
  slug: draftPostsSlug,
  access: {
    create: () => true,
    delete: () => true,
    read: () => true,
    readVersions: () => true,
    update: () => true,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'related', type: 'relationship', relationTo: draftPostsSlug },
    {
      name: 'richText',
      type: 'richText',
      editor: lexicalEditor({
        features: () => [RelationshipFeature({ enabledCollections: [draftPostsSlug] })],
      }),
    },
  ],
  versions: { drafts: true },
}
