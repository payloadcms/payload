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
              required: true,
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
        {
          label: 'Settings',
          fields: [
            {
              name: 'publishedAt',
              type: 'date',
              label: 'Published At',
            },
          ],
        },
        {
          label: 'Analytics',
          fields: [
            {
              name: 'viewCount',
              type: 'number',
              label: 'View Count',
            },
          ],
        },
        {
          label: 'Categories',
          fields: [
            {
              name: 'category',
              type: 'text',
              label: 'Category',
            },
          ],
        },
        {
          label: 'Author Info',
          fields: [
            {
              name: 'authorName',
              type: 'text',
              label: 'Author Name',
            },
          ],
        },
        {
          label: 'Related Posts',
          fields: [
            {
              name: 'relatedPosts',
              type: 'text',
              label: 'Related Posts',
            },
          ],
        },
        {
          label: 'Comments',
          fields: [
            {
              name: 'commentsEnabled',
              type: 'checkbox',
              label: 'Comments Enabled',
            },
          ],
        },
        {
          label: 'Social Sharing',
          fields: [
            {
              name: 'socialImage',
              type: 'text',
              label: 'Social Image',
            },
          ],
        },
        {
          label: 'Advanced Options',
          fields: [
            {
              name: 'customCSS',
              type: 'textarea',
              label: 'Custom CSS',
            },
          ],
        },
        {
          label: 'Permissions',
          fields: [
            {
              name: 'visibility',
              type: 'select',
              label: 'Visibility',
              options: ['public', 'private', 'draft'],
            },
          ],
        },
      ],
    },
  ],
}

export default TabsFields
