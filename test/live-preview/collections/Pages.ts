import type { CollectionConfig } from 'payload'

import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { slateEditor } from '@payloadcms/richtext-slate'

import { Archive } from '../blocks/ArchiveBlock/index.js'
import { CallToAction } from '../blocks/CallToAction/index.js'
import { Content } from '../blocks/Content/index.js'
import { MediaBlock } from '../blocks/MediaBlock/index.js'
import { hero } from '../fields/hero.js'
import { mediaSlug, pagesSlug, postsSlug, tenantsSlug } from '../shared.js'

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
        edit: {
          livePreview: {
            actions: [
              '/components/CollectionLivePreviewButton/index.js#CollectionLivePreviewButton',
            ],
          },
        },
      },
    },
    preview: (doc) => `/live-preview/${doc?.slug}`,
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
              name: 'localizedTitle',
              type: 'text',
              localized: true,
            },
            {
              name: 'relationToLocalized',
              type: 'relationship',
              relationTo: postsSlug,
            },
            {
              label: 'Rich Text — Slate',
              type: 'richText',
              name: 'richTextSlate',
              editor: slateEditor({}),
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
              relationTo: postsSlug,
            },
            {
              name: 'relationshipMonoHasMany',
              type: 'relationship',
              relationTo: postsSlug,
              hasMany: true,
            },
            {
              name: 'relationshipPolyHasOne',
              type: 'relationship',
              relationTo: [postsSlug],
            },
            {
              name: 'relationshipPolyHasMany',
              type: 'relationship',
              relationTo: [postsSlug],
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
                  relationTo: postsSlug,
                },
                {
                  name: 'relationshipInArrayMonoHasMany',
                  type: 'relationship',
                  relationTo: postsSlug,
                  hasMany: true,
                },
                {
                  name: 'relationshipInArrayPolyHasOne',
                  type: 'relationship',
                  relationTo: [postsSlug],
                },
                {
                  name: 'relationshipInArrayPolyHasMany',
                  type: 'relationship',
                  relationTo: [postsSlug],
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
                      relationTo: postsSlug,
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
          relationTo: mediaSlug,
        },
      ],
    },
  ],
}
