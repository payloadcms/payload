import { stubAdapter } from '@/db-stub.js'
import { buildConfig } from 'payload'

export default buildConfig({
  collections: [
    {
      slug: 'posts',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'content',
          type: 'textarea',
        },
        {
          // Virtual field — should be computed in a field-level afterRead hook,
          // but currently computed in a collection-level afterRead hook (wrong).
          name: 'wordCount',
          type: 'number',
          virtual: true,
        },
      ],
      hooks: {
        // WRONG: computing wordCount in a collection-level hook.
        // This logic should live in a field-level afterRead hook on the wordCount field.
        afterRead: [
          ({ doc }) => {
            doc.wordCount = doc.content ? doc.content.split(/\s+/).filter(Boolean).length : 0
            return doc
          },
        ],
      },
    },
  ],
  db: stubAdapter,
  secret: 'eval-fixture',
})
