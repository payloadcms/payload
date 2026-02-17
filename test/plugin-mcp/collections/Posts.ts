import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  fields: [
    {
      name: 'title',
      type: 'text',
      admin: {
        description: 'The title of the post',
      },
      localized: true,
      required: true,
    },
    {
      name: 'content',
      type: 'text',
      admin: {
        description: 'The content of the post',
      },
      defaultValue: 'Hello World.',
      localized: true,
    },
    {
      name: 'author',
      type: 'relationship',
      admin: {
        description: 'The author of the post',
      },
      relationTo: 'users',
    },
    {
      name: 'location',
      type: 'point',
      admin: {
        description: 'Geographic location coordinates',
      },
    },
  ],
  hooks: {
    beforeRead: [
      ({ doc, req }) => {
        if (req.payloadAPI === 'MCP') {
          // Handle both localized (object) and non-localized (string) title
          if (typeof doc.title === 'object' && doc.title !== null) {
            // Localized field - update all locale values
            Object.keys(doc.title).forEach((locale) => {
              doc.title[locale] = `${doc.title[locale]} (MCP Hook Override)`
            })
          } else if (typeof doc.title === 'string') {
            // Non-localized field
            doc.title = `${doc.title} (MCP Hook Override)`
          }
        }
        return doc
      },
    ],
  },
  versions: {
    drafts: true,
  },
}
