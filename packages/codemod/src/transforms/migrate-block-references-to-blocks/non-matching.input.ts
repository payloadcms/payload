import type { CollectionConfig } from 'payload'

export const Pages: CollectionConfig = {
  slug: 'pages',
  fields: [
    {
      name: 'layout',
      type: 'blocks',
      blocks: ['content'],
    },
  ],
}

const blockReferencesPermissions = {}

const metadata = {
  blockReferences: ['leave-me-alone'],
}
