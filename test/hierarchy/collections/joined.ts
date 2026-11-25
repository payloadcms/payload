import type { CollectionConfig } from 'payload'

import { createFolderField, createTagField } from 'payload'

export const joinedFolders = 'joined-folders'
export const joinedTags = 'joined-tags'
export const joinedTopics = 'joined-topics'
export const joinedPages = 'joined-pages'
export const joinedMedia = 'joined-media'

const name = () => ({ name: 'name', type: 'text', required: true }) as const
const folders: CollectionConfig = {
  slug: joinedFolders,
  admin: { useAsTitle: 'name' },
  fields: [name()],
  folders: { collectionSpecific: true },
}
const tags: CollectionConfig = {
  slug: joinedTags,
  admin: { useAsTitle: 'name' },
  fields: [name()],
  tags: true,
}
const topics: CollectionConfig = {
  slug: joinedTopics,
  admin: { useAsTitle: 'name' },
  fields: [name()],
  hierarchy: { parentFieldName: 'topicParent' },
}

function documents(slug: string): CollectionConfig {
  return {
    slug,
    access: { read: () => ({ visible: { equals: true } }) },
    admin: {
      baseFilter: () => ({ scope: { equals: 'public' } }),
      useAsTitle: 'title',
    },
    fields: [
      { name: 'title', type: 'text', required: true },
      { name: 'summary', type: 'textarea' },
      { name: 'scope', type: 'text' },
      { name: 'visible', type: 'checkbox' },
      createFolderField({ relationTo: folders.slug }),
      createTagField({ relationTo: tags.slug }),
      createTagField({ relationTo: topics.slug }),
    ],
  }
}

export const joinedCollections = [
  folders,
  tags,
  topics,
  documents(joinedPages),
  documents(joinedMedia),
]
