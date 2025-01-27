import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types'

import { lexicalEditor } from '../../../packages/richtext-lexical/src'
import { Archive } from '../blocks/ArchiveBlock'
import { CallToAction } from '../blocks/CallToAction'
import { Content } from '../blocks/Content'
import { MediaBlock } from '../blocks/MediaBlock'
import CollectionLivePreviewButton from '../components/CollectionLivePreviewButton'
import { hero } from '../fields/hero'
import { pagesSlug, tenantsSlug } from '../shared'

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
    components: {
      views: {
        Edit: {
          LivePreview: {
            actions: [CollectionLivePreviewButton],
          },
        },
      },
    },
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
          ],
        },
        {
          label: 'Test',
          fields: [
            {
              label: 'Rich Text — Slate',
              type: 'richText',
              name: 'richTextSlate',
            },
            {
              label: 'Rich Text — Lexical',
              type: 'richText',
              name: 'richTextLexical',
              editor: lexicalEditor({}),
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
            {
              label: 'Named Tabs',
              type: 'tabs',
              tabs: [
                {
                  name: 'tab',
                  label: 'Tab',
                  fields: [
                    {
                      name: 'relationshipInTab',
                      type: 'relationship',
                      relationTo: 'posts',
                    },
                  ],
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
