import type { CollectionConfig } from 'payload'

export const topicsSlug = 'topics'
export const articlesSlug = 'articles'
export const draftArticlesSlug = 'draft-articles'
export const notesSlug = 'notes'

export const Topics: CollectionConfig = {
  slug: topicsSlug,
  access: { read: () => true },
  versions: { drafts: true },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'members',
      type: 'join',
      collection: [articlesSlug, draftArticlesSlug, notesSlug],
      on: 'topics',
    },
  ],
}

export const Articles: CollectionConfig = {
  slug: articlesSlug,
  access: { read: () => ({ published: { equals: true } }) },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'published', type: 'checkbox' },
    { name: 'topics', type: 'relationship', hasMany: true, relationTo: topicsSlug },
    { name: 'otherTopics', type: 'relationship', hasMany: true, relationTo: topicsSlug },
  ],
}

export const Notes: CollectionConfig = {
  slug: notesSlug,
  access: { read: () => true },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'topics', type: 'relationship', relationTo: topicsSlug },
  ],
}

export const DraftArticles: CollectionConfig = {
  slug: draftArticlesSlug,
  access: { read: () => ({ visible: { equals: true } }) },
  versions: { drafts: true },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'visible', type: 'checkbox' },
    { name: 'tags', type: 'select', hasMany: true, options: ['featured', 'other'] },
    { name: 'topics', type: 'relationship', hasMany: true, relationTo: topicsSlug },
  ],
}
