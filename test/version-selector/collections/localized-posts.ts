import type { CollectionConfig } from 'payload'

import { localizedPostsSlug } from '../slugs.js'

export const LocalizedPosts: CollectionConfig = {
  slug: localizedPostsSlug,
  access: {
    create: () => true,
    delete: () => true,
    read: ({ req }) =>
      typeof req.context.versionQueryTitle === 'string'
        ? { title: { equals: req.context.versionQueryTitle } }
        : true,
    readVersions: () => true,
    update: ({ req }) =>
      typeof req.context.versionUpdateTitle === 'string'
        ? { title: { equals: req.context.versionUpdateTitle } }
        : true,
  },
  fields: [
    { name: 'title', type: 'text', localized: true },
    { name: 'summary', type: 'text' },
    { name: 'richText', type: 'richText', localized: true },
    {
      name: 'localizedDetails',
      type: 'group',
      fields: [
        { name: 'heading', type: 'text' },
        { name: 'body', type: 'text' },
      ],
      localized: true,
    },
    {
      name: 'details',
      type: 'group',
      fields: [
        { name: 'heading', type: 'text', localized: true },
        { name: 'note', type: 'text' },
        {
          name: 'localizedNested',
          type: 'group',
          fields: [
            { name: 'first', type: 'text' },
            { name: 'second', type: 'text' },
          ],
          localized: true,
        },
      ],
    },
    {
      name: 'rows',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', localized: true },
        { name: 'note', type: 'text' },
      ],
    },
    {
      name: 'localizedRows',
      type: 'array',
      fields: [
        { name: 'label', type: 'text' },
        { name: 'note', type: 'text' },
      ],
      localized: true,
    },
  ],
  versions: { drafts: { localizeStatus: true } },
}
