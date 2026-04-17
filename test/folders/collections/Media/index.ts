import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    adminThumbnail: ({ doc }) => {
      if (doc.testAdminThumbnail && typeof doc.testAdminThumbnail === 'string') {
        return doc.testAdminThumbnail
      }
      return null
    },
  },
  folders: true,
  admin: {
    components: {
      views: {
        conflictingView: {
          Component: '/components/ConflictingView/index.js#ConflictingView',
          exact: true,
          path: '/payload-folders',
        },
      },
    },
  },
  fields: [
    {
      name: 'testAdminThumbnail',
      type: 'text',
    },
  ],
}
