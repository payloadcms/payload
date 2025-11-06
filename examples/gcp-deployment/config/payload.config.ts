import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { gcsStorage } from '@payloadcms/storage-gcs'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',

  // Database
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI,
    },
  }),

  // Admin panel
  admin: {
    user: 'users',
    autoLogin:
      process.env.NODE_ENV === 'development'
        ? {
            email: 'dev@payloadcms.com',
            password: 'test',
            prefillOnly: true,
          }
        : false,
  },

  // Collections
  collections: [
    {
      slug: 'users',
      auth: true,
      admin: {
        useAsTitle: 'email',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
    },
    {
      slug: 'media',
      upload: {
        staticDir: path.resolve(dirname, '../uploads'),
        imageSizes: [
          {
            name: 'thumbnail',
            width: 300,
            height: 300,
            position: 'centre',
          },
          {
            name: 'card',
            width: 768,
            height: 512,
            position: 'centre',
          },
          {
            name: 'hero',
            width: 1920,
            height: 1080,
            position: 'centre',
          },
        ],
        mimeTypes: ['image/*', 'application/pdf', 'video/*'],
      },
      fields: [
        {
          name: 'alt',
          type: 'text',
          required: true,
        },
        {
          name: 'caption',
          type: 'text',
        },
      ],
      access: {
        read: () => true,
      },
    },
    {
      slug: 'documents',
      upload: {
        staticDir: path.resolve(dirname, '../uploads/documents'),
        mimeTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ],
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
    },
  ],

  // Editor
  editor: lexicalEditor({}),

  // Secret
  secret: process.env.PAYLOAD_SECRET || 'YOUR_SECRET_HERE',

  // TypeScript
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  // Plugins
  plugins: [
    gcsStorage({
      collections: {
        media: true,
        documents: true,
      },
      bucket: process.env.GCS_BUCKET_NAME || '',
      options: {
        projectId: process.env.GCP_PROJECT_ID,
        keyFilename: process.env.GCP_KEY_FILE,
      },
      acl: 'Public', // or 'Private' for signed URLs
      // Enable client-side uploads to bypass server limits on Vercel
      clientUploads: {
        // Optional: restrict who can upload directly
        access: async ({ req }) => {
          // Only allow authenticated users
          return !!req.user
        },
      },
    }),
  ],

  // CORS
  cors: [
    process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',
    'https://storage.googleapis.com',
  ].filter(Boolean),

  // CSRF
  csrf: [
    process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',
    // Add your frontend URLs here
  ].filter(Boolean),

  // Rate limiting
  rateLimit: {
    max: 500,
    window: 15 * 60 * 1000, // 15 minutes
  },

  // GraphQL
  graphQL: {
    schemaOutputFile: path.resolve(dirname, 'generated-schema.graphql'),
  },
})
