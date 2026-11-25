import type { CollectionConfig } from 'payload'

export const topicsSlug = 'topics'
export const articlesSlug = 'articles'
export const draftArticlesSlug = 'draft-articles'
export const sectionArticlesSlug = 'section-articles'
export const notesSlug = 'notes'
export const mediaSlug = 'join-media'
export const mediaArticlesSlug = 'media-articles'
export const mediaNotesSlug = 'media-notes'

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
    { name: 'articles', type: 'join', collection: articlesSlug, on: 'topics' },
    {
      name: 'sectionMembers',
      type: 'join',
      collection: [sectionArticlesSlug],
      on: 'related_sections.topics',
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

export const Media: CollectionConfig = {
  slug: mediaSlug,
  access: { read: () => true },
  upload: { disableLocalStorage: true },
  fields: [
    {
      name: 'members',
      type: 'join',
      collection: [mediaArticlesSlug, mediaNotesSlug],
      on: 'media',
    },
  ],
}

export const MediaArticles: CollectionConfig = {
  slug: mediaArticlesSlug,
  access: { read: () => true },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'media', type: 'upload', hasMany: true, relationTo: mediaSlug },
  ],
}

export const MediaNotes: CollectionConfig = {
  slug: mediaNotesSlug,
  access: { read: () => true },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'media', type: 'upload', relationTo: mediaSlug },
  ],
}
export const SectionArticles: CollectionConfig = {
  slug: sectionArticlesSlug,
  access: { read: () => true },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'related_sections',
      type: 'array',
      fields: [
        { name: 'topics', type: 'relationship', hasMany: true, relationTo: topicsSlug },
        {
          name: 'nested',
          type: 'array',
          fields: [{ name: 'topics', type: 'relationship', hasMany: true, relationTo: topicsSlug }],
        },
      ],
    },
    {
      name: 'relatedXsections',
      type: 'array',
      fields: [{ name: 'topics', type: 'relationship', hasMany: true, relationTo: topicsSlug }],
    },
  ],
}
