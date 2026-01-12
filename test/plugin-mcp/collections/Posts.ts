import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      admin: {
        description: 'The title of the post',
      },
      required: true,
    },
    {
      name: 'content',
      type: 'text',
      localized: true,
      admin: {
        description: 'The content of the post',
      },
      defaultValue: 'Hello World.',
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'The author of the post',
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
}
