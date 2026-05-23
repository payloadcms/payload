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
      ],
    },
  ],
  db: stubAdapter,
  jobs: {
    tasks: [
      {
        slug: 'generate-pdf',
        inputSchema: [{ name: 'postId', type: 'text', required: true }],
        // BUG: relative paths don't work for job handlers — must use an absolute path
        // built from path.resolve + fileURLToPath(import.meta.url)
        handler: './tasks/generatePDF#generatePDFHandler',
      },
    ],
  },
  secret: 'eval-fixture',
})
