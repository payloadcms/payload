import { stubAdapter } from '@/db-stub.js'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'

export default buildConfig({
  db: stubAdapter,
  secret: 'eval-fixture',
  editor: lexicalEditor({}),
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
          name: 'body',
          type: 'richText',
          editor: lexicalEditor({}),
        },
      ],
    },
  ],
})
