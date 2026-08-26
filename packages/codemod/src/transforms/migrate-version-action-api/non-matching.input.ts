import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  fields: [
    {
      name: 'draft',
      type: 'checkbox',
    },
  ],
  versions: {
    drafts: true,
  },
}

export async function createWithDraftField(payload) {
  return payload.create({
    collection: 'posts',
    data: {
      draft: true,
      title: 'Document field named draft',
    },
  })
}

export const copy = 'Save Draft'
