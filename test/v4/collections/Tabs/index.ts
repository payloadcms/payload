import type { CollectionConfig } from 'payload'

import { lexicalEditor } from '@payloadcms/richtext-lexical'

import { tabsFieldsSlug } from '../../slugs.js'

const TabsFields: CollectionConfig = {
  slug: tabsFieldsSlug,
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'title',
              type: 'text',
              label: 'Title',
            },
            {
              name: 'postContent',
              type: 'richText',
              label: 'Post Content',
              editor: lexicalEditor({}),
            },
          ],
        },
        {
          label: 'Media',
          fields: [
            {
              name: 'featuredImage',
              type: 'text',
              label: 'Featured Image',
            },
          ],
        },
        {
          label: 'SEO',
          fields: [
            {
              name: 'metaTitle',
              type: 'text',
              label: 'Meta Title',
            },
            {
              name: 'metaDescription',
              type: 'textarea',
              label: 'Meta Description',
            },
          ],
        },
      ],
    },
  ],
}

export default TabsFields
