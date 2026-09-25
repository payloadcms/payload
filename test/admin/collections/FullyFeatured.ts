import type { CollectionConfig } from 'payload'

import { lexicalEditor } from '@payloadcms/richtext-lexical'

import { fullyFeaturedCollectionSlug, postsCollectionSlug, uploadCollectionSlug } from '../slugs.js'

export const FullyFeatured: CollectionConfig = {
  slug: fullyFeaturedCollectionSlug,
  admin: {
    useAsTitle: 'title',
    group: 'One',
    listSearchableFields: ['title', 'slug'],
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'content',
              type: 'richText',
              localized: true,
              editor: lexicalEditor({}),
            },
            {
              name: 'excerpt',
              type: 'textarea',
              localized: true,
              admin: {
                description: 'Short summary for list views and SEO',
              },
            },
          ],
        },
        {
          label: 'Media & Layout',
          fields: [
            {
              name: 'heroImage',
              type: 'upload',
              relationTo: uploadCollectionSlug,
            },
            {
              name: 'layout',
              type: 'blocks',
              localized: true,
              blocks: [
                {
                  slug: 'richTextBlock',
                  fields: [
                    {
                      name: 'richText',
                      type: 'richText',
                      editor: lexicalEditor({}),
                    },
                  ],
                },
                {
                  slug: 'imageBlock',
                  fields: [
                    {
                      name: 'image',
                      type: 'upload',
                      relationTo: uploadCollectionSlug,
                      required: true,
                    },
                    {
                      name: 'caption',
                      type: 'text',
                      localized: true,
                    },
                    {
                      name: 'size',
                      type: 'select',
                      defaultValue: 'medium',
                      options: [
                        { label: 'Small', value: 'small' },
                        { label: 'Medium', value: 'medium' },
                        { label: 'Full Width', value: 'fullWidth' },
                      ],
                    },
                  ],
                },
                {
                  slug: 'ctaBlock',
                  fields: [
                    {
                      name: 'heading',
                      type: 'text',
                      required: true,
                      localized: true,
                    },
                    {
                      name: 'description',
                      type: 'textarea',
                      localized: true,
                    },
                    {
                      name: 'links',
                      type: 'array',
                      fields: [
                        {
                          name: 'label',
                          type: 'text',
                          required: true,
                          localized: true,
                        },
                        {
                          name: 'url',
                          type: 'text',
                          required: true,
                        },
                        {
                          name: 'style',
                          type: 'select',
                          defaultValue: 'primary',
                          options: [
                            { label: 'Primary', value: 'primary' },
                            { label: 'Secondary', value: 'secondary' },
                            { label: 'Outline', value: 'outline' },
                          ],
                        },
                      ],
                    },
                  ],
                },
                {
                  slug: 'cardGridBlock',
                  fields: [
                    {
                      name: 'cards',
                      type: 'array',
                      minRows: 1,
                      maxRows: 12,
                      fields: [
                        {
                          name: 'title',
                          type: 'text',
                          required: true,
                          localized: true,
                        },
                        {
                          name: 'description',
                          type: 'textarea',
                          localized: true,
                        },
                        {
                          name: 'image',
                          type: 'upload',
                          relationTo: uploadCollectionSlug,
                        },
                        {
                          name: 'link',
                          type: 'group',
                          fields: [
                            {
                              name: 'label',
                              type: 'text',
                              localized: true,
                            },
                            {
                              name: 'url',
                              type: 'text',
                            },
                          ],
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
          label: 'Metadata',
          fields: [
            {
              name: 'tags',
              type: 'array',
              fields: [
                {
                  name: 'tag',
                  type: 'text',
                  required: true,
                },
              ],
            },
            {
              name: 'relatedPosts',
              type: 'relationship',
              relationTo: postsCollectionSlug,
              hasMany: true,
            },
            {
              name: 'category',
              type: 'select',
              localized: true,
              options: [
                { label: 'News', value: 'news' },
                { label: 'Blog', value: 'blog' },
                { label: 'Tutorial', value: 'tutorial' },
                { label: 'Case Study', value: 'case-study' },
              ],
            },
            {
              name: 'priority',
              type: 'number',
              min: 1,
              max: 10,
              admin: {
                step: 1,
                description: 'Priority from 1 (lowest) to 10 (highest)',
              },
            },
          ],
        },
        {
          label: 'SEO',
          name: 'seo',
          fields: [
            {
              name: 'metaTitle',
              type: 'text',
              localized: true,
            },
            {
              name: 'metaDescription',
              type: 'textarea',
              localized: true,
            },
            {
              name: 'ogImage',
              type: 'upload',
              relationTo: uploadCollectionSlug,
            },
            {
              name: 'noIndex',
              type: 'checkbox',
              defaultValue: false,
            },
          ],
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'isFeatured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'publishedDate',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'authors',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
