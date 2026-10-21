import type { CollectionConfig } from 'payload'

import { queryDocsSlug, queryTagsSlug, queryTextTagsSlug } from '../../slugs.js'

export const QueryDocs: CollectionConfig = {
  slug: queryDocsSlug,
  access: {
    create: () => true,
    read: ({ req }) => req.context.queryDocAccess ?? true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    { name: 'id', type: 'number' },
    { name: 'rank', type: 'number', index: true },
    { name: 'fr', type: 'text' },
    { name: 'title', type: 'text', localized: true },
    { name: '_branchProjection_branchKey', type: 'text', localized: true },
    { name: 'localeTarget', type: 'relationship', relationTo: queryTagsSlug, localized: true },
    {
      name: 'details',
      type: 'group',
      localized: true,
      fields: [
        { name: 'heading', type: 'text', localized: true },
        { name: 'target', type: 'relationship', relationTo: queryTagsSlug, localized: true },
      ],
    },
    { name: 'one', type: 'relationship', relationTo: queryDocsSlug },
    { name: 'related', type: 'relationship', relationTo: queryDocsSlug, hasMany: true },
    {
      name: 'poly',
      type: 'relationship',
      relationTo: [queryDocsSlug, queryTagsSlug, queryTextTagsSlug],
      hasMany: true,
    },
    { name: 'tag', type: 'relationship', relationTo: queryTagsSlug },
    { name: 'backlinks', type: 'join', collection: queryDocsSlug, on: 'one', defaultSort: 'rank' },
    {
      name: 'configuredBacklinks',
      type: 'join',
      collection: queryDocsSlug,
      on: 'one',
      defaultSort: '-title.fr',
      where: { id: { not_equals: 1 } },
    },
    {
      name: 'mixedBacklinks',
      type: 'join',
      collection: [queryDocsSlug, queryTagsSlug],
      on: 'one',
      defaultSort: 'rank',
    },
    {
      name: 'typedBacklinks',
      type: 'join',
      collection: [queryDocsSlug, queryTextTagsSlug],
      on: 'one',
      defaultSort: 'id',
    },
    {
      name: 'sections',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', localized: true },
        { name: 'target', type: 'relationship', relationTo: queryDocsSlug },
      ],
    },
    {
      name: 'content',
      type: 'blocks',
      blocks: [
        {
          slug: 'query-note',
          fields: [
            { name: 'label', type: 'text', localized: true },
            { name: 'target', type: 'relationship', relationTo: queryDocsSlug },
          ],
        },
      ],
    },
  ],
  versions: { drafts: true },
}
