import type { CollectionConfig } from 'payload'

import { childrenSlug, notesSlug, parentsSlug } from '../shared.js'

export const Parents: CollectionConfig = {
  slug: parentsSlug,
  fields: [
    { name: 'id', type: 'text' },
    { name: 'title', type: 'text' },
    { name: 'favorite', type: 'relationship', relationTo: childrenSlug, hasMany: true },
    { name: '_branch', type: 'text' },
    { name: '_branchDocID', type: 'text' },
    { name: 'children', type: 'join', collection: childrenSlug, on: 'owner' },
    {
      name: 'localizedChildren',
      type: 'join',
      collection: childrenSlug,
      on: 'localizedOwner',
      localized: true,
    },
    { name: 'allChildren', type: 'join', collection: [childrenSlug, notesSlug], on: 'owner' },
  ],
  versions: { drafts: true },
}

export const Children: CollectionConfig = {
  slug: childrenSlug,
  fields: [
    { name: 'location', type: 'point' },
    { name: 'id', type: 'text' },
    { name: 'title', type: 'text' },
    { name: '_branch', type: 'text' },
    { name: '_branchDocID', type: 'text' },
    { name: 'owner', type: 'relationship', relationTo: parentsSlug },
    { name: 'localizedOwner', type: 'relationship', relationTo: parentsSlug, localized: true },
  ],
  versions: { drafts: true },
}

export const Notes: CollectionConfig = {
  slug: notesSlug,
  fields: [
    { name: 'id', type: 'text' },
    { name: '_branch', type: 'text' },
    { name: '_branchDocID', type: 'text' },
    { name: 'owner', type: 'relationship', relationTo: parentsSlug },
  ],
}
