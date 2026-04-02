import type { CollectionConfig } from 'payload'

export const FormatDocURL: CollectionConfig = {
  slug: 'format-doc-url',
  admin: {
    // Custom formatDocURL function to control linking behavior
    formatDocURL: ({ doc, defaultURL, req, collectionSlug, viewType }) => {
      // Disable linking for documents with title 'no-link'
      if (doc.title === 'no-link') {
        return null
      }

      // Custom link for documents with title 'custom-link'
      if (doc.title === 'custom-link') {
        return '/custom-destination'
      }

      // Example: Add query params based on user email (fallback for normal cases)
      if (
        req.user?.email === 'dev@payloadcms.com' &&
        viewType !== 'trash' &&
        doc._status === 'draft'
      ) {
        return defaultURL + '?admin=true'
      }

      // Example: Different behavior in trash view (check this before user-specific logic)
      if (viewType === 'trash') {
        return defaultURL + '?from=trash'
      }

      // Example: Collection-specific behavior for published docs
      if (collectionSlug === 'format-doc-url' && doc._status === 'published') {
        return defaultURL + '?published=true'
      }

      // For all other documents, just return the default URL
      return defaultURL
    },
  },
  trash: true,
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
  ],
}
