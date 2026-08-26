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
          description: 'Main content fields for the post',
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
          description: 'Media and images for the post',
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
          description: 'Search engine optimization settings',
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
          description: 'Publication and scheduling settings',
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
          description: 'View statistics and engagement metrics',
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
          description: 'Categorization and tagging',
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
          description: 'Author details and attribution',
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
          description: 'Links to related content',
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
          description: 'Comment moderation settings',
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
          description: 'Social media sharing configuration',
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
          description: 'Advanced customization options',
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
          description: 'Access control and visibility settings',
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
    {
      name: 'sidebarGroup',
      type: 'group',
      label: 'Sidebar Settings',
      fields: [
        {
          type: 'tabs',
          tabs: [
            {
              description: 'Widget configuration for the sidebar',
              label: 'Widgets',
              fields: [
                {
                  name: 'showRecentPosts',
                  type: 'checkbox',
                  label: 'Show Recent Posts',
                },
                {
                  name: 'showCategories',
                  type: 'checkbox',
                  label: 'Show Categories',
                },
              ],
            },
            {
              description: 'Advertisement placement settings',
              label: 'Ads',
              fields: [
                {
                  name: 'adCode',
                  type: 'textarea',
                  label: 'Ad Code',
                },
              ],
            },
            {
              description: 'Custom sidebar HTML content',
              label: 'Custom HTML',
              fields: [
                {
                  name: 'customHTML',
                  type: 'textarea',
                  label: 'Custom HTML',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Advanced Tabs Settings',
      fields: [
        {
          type: 'tabs',
          tabs: [
            {
              description: 'Integration settings for third-party services',
              label: 'Integrations',
              fields: [
                {
                  name: 'apiKey',
                  type: 'text',
                  label: 'API Key',
                },
                {
                  name: 'webhookUrl',
                  type: 'text',
                  label: 'Webhook URL',
                },
              ],
            },
            {
              description: 'Notification preferences and settings',
              label: 'Notifications',
              fields: [
                {
                  name: 'emailNotifications',
                  type: 'checkbox',
                  label: 'Email Notifications',
                },
                {
                  name: 'pushNotifications',
                  type: 'checkbox',
                  label: 'Push Notifications',
                },
              ],
            },
            {
              description: 'Backup and restore options',
              label: 'Backup',
              fields: [
                {
                  name: 'autoBackup',
                  type: 'checkbox',
                  label: 'Auto Backup',
                },
                {
                  name: 'backupFrequency',
                  type: 'select',
                  label: 'Backup Frequency',
                  options: ['daily', 'weekly', 'monthly'],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  versions: false,
}

export default TabsFields
