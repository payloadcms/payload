import type { CollectionConfig } from 'payload'

import { FixedToolbarFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

import { contentAccess, publishedOrEditor } from '../../access.js'
import { slugField } from '../../fields.js'

export const Articles: CollectionConfig = {
  slug: 'articles',
  access: { ...contentAccess, read: publishedOrEditor },
  admin: {
    defaultColumns: ['title', 'author', '_status', 'updatedAt'],
    group: 'Content',
    useAsTitle: 'title',
  },
  fields: [
    { name: 'title', type: 'text', localized: true, required: true },
    slugField,
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            { name: 'excerpt', type: 'textarea', localized: true, maxLength: 240 },
            {
              name: 'body',
              type: 'richText',
              editor: lexicalEditor({
                features: ({ defaultFeatures }) => [...defaultFeatures, FixedToolbarFeature()],
              }),
              localized: true,
              required: true,
            },
            { name: 'cover', type: 'upload', relationTo: 'media' },
            {
              name: 'sections',
              type: 'blocks',
              blocks: [
                {
                  slug: 'callout',
                  fields: [
                    {
                      name: 'tone',
                      type: 'select',
                      defaultValue: 'tip',
                      options: ['tip', 'note', 'warning'],
                    },
                    { name: 'text', type: 'textarea', required: true },
                  ],
                },
                {
                  slug: 'gearList',
                  fields: [
                    { name: 'heading', type: 'text' },
                    {
                      name: 'products',
                      type: 'relationship',
                      hasMany: true,
                      relationTo: 'products',
                    },
                  ],
                },
              ],
            },
          ],
          label: 'Story',
        },
        {
          fields: [
            { name: 'author', type: 'relationship', relationTo: 'authors', required: true },
            { name: 'categories', type: 'relationship', hasMany: true, relationTo: 'categories' },
            {
              name: 'relatedArticles',
              type: 'relationship',
              hasMany: true,
              relationTo: 'articles',
            },
            {
              name: 'seo',
              type: 'group',
              fields: [
                { name: 'title', type: 'text', localized: true },
                { name: 'description', type: 'textarea', localized: true },
              ],
            },
          ],
          label: 'Discovery',
        },
      ],
    },
    { name: 'featured', type: 'checkbox', admin: { position: 'sidebar' }, defaultValue: false },
    {
      name: 'publishedAt',
      type: 'date',
      admin: { date: { pickerAppearance: 'dayAndTime' }, position: 'sidebar' },
    },
  ],
  versions: { drafts: { autosave: { interval: 1500 } }, maxPerDoc: 20 },
}
