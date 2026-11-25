import type { CollectionConfig } from 'payload'

export const mongoJoinParentsSlug = 'mongo-join-parents'
export const mongoJoinArticlesSlug = 'mongo-join-articles'
export const mongoJoinNotesSlug = 'mongo-join-notes'

export const MongoJoinUsers: CollectionConfig = {
  slug: 'users',
  auth: true,
  fields: [],
}

export const MongoJoinParents: CollectionConfig = {
  slug: mongoJoinParentsSlug,
  fields: [
    {
      name: 'children',
      type: 'join',
      collection: [mongoJoinArticlesSlug, mongoJoinNotesSlug],
      on: 'parent',
    },
  ],
}

export const MongoJoinArticles: CollectionConfig = {
  slug: mongoJoinArticlesSlug,
  access: {
    read: ({ req }) => ({
      articleScope: { equals: 'shared' },
      parent: { equals: req.context.allowedParentID as string },
      variant: { contains: 'pub' },
    }),
  },
  fields: [
    { name: 'parent', type: 'relationship', relationTo: mongoJoinParentsSlug },
    { name: 'title', type: 'text' },
    { name: 'articleScope', type: 'text' },
    { name: 'variant', type: 'select', hasMany: true, options: ['pub', 'private'] },
  ],
}

export const MongoJoinNotes: CollectionConfig = {
  slug: mongoJoinNotesSlug,
  access: {
    read: ({ req }) => ({
      isVisible: { equals: true },
      parent: { in: [req.context.allowedParentID as string] },
      variant: { contains: 'pub' },
    }),
  },
  fields: [
    { name: 'parent', type: 'relationship', hasMany: true, relationTo: mongoJoinParentsSlug },
    { name: 'title', type: 'text' },
    { name: 'isVisible', type: 'checkbox' },
    { name: 'variant', type: 'text' },
  ],
}
