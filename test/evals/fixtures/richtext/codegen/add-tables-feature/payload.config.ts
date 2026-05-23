import { stubAdapter } from '@/db-stub.js'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
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
          type: 'richText',
          editor: lexicalEditor({}),
        },
      ],
    },
  ],
  db: stubAdapter,
  editor: lexicalEditor({}),
  secret: 'eval-fixture',
})
