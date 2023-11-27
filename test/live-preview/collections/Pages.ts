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
        {
          label: 'Test',
          fields: [
            {
              name: 'relationshipInRichText',
              type: 'richText',
            },
            {
              name: 'relationshipAsUpload',
              type: 'upload',
              relationTo: 'media',
            },
            {
              name: 'relationshipMonoHasOne',
              type: 'relationship',
              relationTo: 'posts',
            },
            {
              name: 'relationshipMonoHasMany',
              type: 'relationship',
              relationTo: 'posts',
              hasMany: true,
            },
            {
              name: 'relationshipPolyHasOne',
              type: 'relationship',
              relationTo: ['posts'],
            },
            {
              name: 'relationshipPolyHasMany',
              type: 'relationship',
              relationTo: ['posts'],
              hasMany: true,
            },
            {
              name: 'arrayOfRelationships',
              type: 'array',
              fields: [
                {
                  name: 'uploadInArray',
                  type: 'upload',
                  relationTo: 'media',
                },
                {
                  name: 'richTextInArray',
                  type: 'richText',
                },
                {
                  name: 'relationshipInArrayMonoHasOne',
                  type: 'relationship',
                  relationTo: 'posts',
                },
                {
                  name: 'relationshipInArrayMonoHasMany',
                  type: 'relationship',
                  relationTo: 'posts',
                  hasMany: true,
                },
                {
                  name: 'relationshipInArrayPolyHasOne',
                  type: 'relationship',
                  relationTo: ['posts'],
                },
                {
                  name: 'relationshipInArrayPolyHasMany',
                  type: 'relationship',
                  relationTo: ['posts'],
                  hasMany: true,
                },
              ],
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
  ],
}
