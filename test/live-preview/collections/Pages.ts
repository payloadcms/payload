import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types'

import { Archive } from '../blocks/ArchiveBlock'
import { CallToAction } from '../blocks/CallToAction'
import { Content } from '../blocks/Content'
import { MediaBlock } from '../blocks/MediaBlock'
import { hero } from '../fields/hero'
import { pagesSlug } from '../shared'

export const Pages: CollectionConfig = {
  slug: pagesSlug,
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['id', 'title', 'slug', 'createdAt'],
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
          relationTo: 'media',
        },
      ],
    },
    // Hidden fields for testing purposes
    {
      name: 'relationshipPolyHasMany',
      type: 'relationship',
      relationTo: ['posts'],
      hasMany: true,
      admin: {
        hidden: true,
      },
    },
    {
      name: 'relationshipMonoHasMany',
      type: 'relationship',
      relationTo: 'posts',
      hasMany: true,
      admin: {
        hidden: true,
      },
    },
    {
      name: 'relationshipMonoHasOne',
      type: 'relationship',
      relationTo: 'posts',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'arrayOfRelationships',
      type: 'array',
      admin: {
        hidden: true,
      },
      fields: [
        {
          name: 'relationshipWithinArray',
          type: 'relationship',
          relationTo: 'posts',
          admin: {
            hidden: true,
          },
        },
      ],
    },
  ],
}
