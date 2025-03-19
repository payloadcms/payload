import type { GlobalConfig } from 'payload'

import { globalSlug } from '../slugs.js'

export const Global: GlobalConfig = {
  slug: globalSlug,
  admin: {
    components: {
      views: {
        edit: {
          api: {
            actions: ['/components/actions/GlobalAPIButton/index.js#GlobalAPIButton'],
          },
          default: {
            actions: ['/components/actions/GlobalEditButton/index.js#GlobalEditButton'],
          },
        },
      },
      elements: {
        beforeDocumentMenuItems: [
          {
            path: '/components/Banner/index.js#Banner',
            clientProps: {
              message: 'BeforeDocumentMenuItems custom component',
            },
          },
        ],
        afterDocumentMenuItems: [
          {
            path: '/components/Banner/index.js#Banner',
            clientProps: {
              message: 'AfterDocumentMenuItems custom component',
            },
          },
        ],
      },
    },
    group: 'Group',
    preview: () => 'https://payloadcms.com',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'sidebarField',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
    },
  ],
  label: {
    en: 'My Global Label',
  },
  versions: {
    drafts: true,
  },
}
