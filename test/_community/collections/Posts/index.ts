import type { CollectionConfig } from 'payload'

import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const postsSlug = 'posts'

export const PostsCollection: CollectionConfig = {
  slug: postsSlug,
  admin: {
    useAsTitle: 'title',
    enableListViewSelectAPI: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [...defaultFeatures],
      }),
    },
    {
      name: 'singleBlockLayout',
      type: 'blocks',
      label: 'Single Block Layout',
      labels: {
        singular: 'CTA Block',
        plural: 'CTA Blocks',
      },
      blocks: [
        {
          slug: 'cta',
          labels: { singular: 'Call to Action', plural: 'Calls to Action' },
          fields: [
            { name: 'heading', type: 'text' },
            { name: 'buttonText', type: 'text' },
          ],
        },
      ],
    },
    {
      name: 'multiBlockLayout',
      type: 'blocks',
      label: 'Multi Block Layout',
      labels: {
        singular: 'Content Block',
        plural: 'Content Blocks',
      },
      blocks: [
        {
          slug: 'hero',
          labels: { singular: 'Hero', plural: 'Heroes' },
          fields: [
            { name: 'heading', type: 'text' },
            { name: 'subheading', type: 'text' },
          ],
        },
        {
          slug: 'textContent',
          labels: { singular: 'Text Content', plural: 'Text Contents' },
          fields: [{ name: 'body', type: 'textarea' }],
        },
        {
          slug: 'imageGallery',
          labels: { singular: 'Image Gallery', plural: 'Image Galleries' },
          fields: [{ name: 'caption', type: 'text' }],
        },
      ],
    },
  ],
}
