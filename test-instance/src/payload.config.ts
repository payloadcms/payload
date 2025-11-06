import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { gcsStorage } from '@payloadcms/storage-gcs'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

import { Users } from './collections/Users.js'
import { Media } from './collections/Media.js'
import { Documents } from './collections/Documents.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',

  // Admin
  admin: {
    user: 'users',
    autoLogin:
      process.env.NODE_ENV === 'development'
        ? {
            email: 'test@payloadcms.com',
            password: 'test',
            prefillOnly: true,
          }
        : false,
    meta: {
      titleSuffix: '- Test Instance',
      favicon: '/favicon.ico',
    },
  },

  // Database
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI,
    },
  }),

  // Collections
  collections: [Users, Media, Documents],

  // Editor
  editor: lexicalEditor({}),

  // Secret
  secret: process.env.PAYLOAD_SECRET || 'YOUR_SECRET_HERE',

  // TypeScript
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  // GraphQL
  graphQL: {
    schemaOutputFile: path.resolve(dirname, 'generated-schema.graphql'),
  },

  // Plugins
  plugins: [
    gcsStorage({
      collections: {
        media: true,
        documents: {
          disablePayloadAccessControl: true,
        },
      },
      bucket: process.env.GCS_BUCKET_NAME || '',
      options: {
        projectId: process.env.GCP_PROJECT_ID,
        keyFilename: process.env.GCP_KEY_FILE,
      },
      // Use 'Public' for testing, 'Private' for production
      acl: process.env.GCS_ACL === 'private' ? 'Private' : 'Public',
      // Enable client uploads for testing
      clientUploads: {
        access: async ({ req }) => {
          // For testing, allow all authenticated users
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
    'http://localhost:3000',
  ].filter(Boolean),
})
