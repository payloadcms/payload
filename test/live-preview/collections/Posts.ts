import type { CollectionConfig } from 'payload'

import { Archive } from '../blocks/ArchiveBlock/index.js'
import { CallToAction } from '../blocks/CallToAction/index.js'
import { Content } from '../blocks/Content/index.js'
import { MediaBlock } from '../blocks/MediaBlock/index.js'
import { hero } from '../fields/hero.js'
import { mediaSlug, postsSlug, tenantsSlug } from '../shared.js'

export const Posts: CollectionConfig = {
  slug: postsSlug,
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['id', 'title', 'slug', 'createdAt'],
    preview: (doc) => `/live-preview/posts/${doc?.slug}`,
  },
  fields: [
    {
      name: 'slug',
      type: 'text',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: tenantsSlug,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Hero',
          fields: [hero],
        },
        {
          label: 'Content',
          fields: [
            {
              name: 'layout',
              type: 'blocks',
              blocks: [CallToAction, Content, MediaBlock, Archive],
            },
            {
              name: 'relatedPosts',
              type: 'relationship',
              relationTo: postsSlug,
              hasMany: true,
              filterOptions: ({ id }) => {
                return {
                  id: {
                    not_in: [id],
                  },
                }
              },
            },
          ],
        },
        {
          label: 'Test',
          fields: [
            {
              name: 'localizedTitle',
              type: 'text',
              localized: true,
            },
          ],
        },
      ],
    },
    {
      name: 'meta',
      type: 'group',
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'description',
          type: 'textarea',
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: mediaSlug,
        },
      ],
    },
  ],
}
