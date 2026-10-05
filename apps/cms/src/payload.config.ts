import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Clients } from './collections/Clients'
import { Events } from './collections/Events'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Profiles } from './collections/Profiles'
import { Users } from './collections/Users'
import { sendgridAdapter } from './email/sendgrid'
import { healthEndpoint } from './endpoints/health'
import { s3StorageAdapter } from './storage/s3'
import { timezones } from './timezones'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * Public origin the admin panel is served from, e.g. `https://cms.example.com`.
 * It must exactly match the URL in the browser's address bar (scheme + host + port),
 * otherwise Payload's CSRF protection rejects cookie-authenticated requests.
 */
const serverURL = process.env.SERVER_URL?.replace(/\/+$/, '') || ''

/**
 * Additional origins (comma-separated) allowed to call the API with credentials,
 * e.g. a separate frontend: `https://www.example.com,https://preview.example.com`.
 */
const allowedOrigins = [
  serverURL,
  ...(process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean),
].filter(Boolean)

export default buildConfig({
  admin: {
    components: {
      views: {
        // Two-factor setup and login check, see src/proxy.ts
        twoFactor: {
          Component: '/components/TwoFactorView#TwoFactorView',
          exact: true,
          path: '/2fa',
        },
      },
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    // Default list plus cities such as Hong Kong and Paris, for event dates
    timezones,
    user: Users.slug,
  },
  collections: [Users, Media, Posts, Pages, Profiles, Clients, Events],
  cors: allowedOrigins,
  csrf: allowedOrigins,
  db: mongooseAdapter({
    connectOptions: {
      maxPoolSize: Number(process.env.DATABASE_MAX_POOL_SIZE || 10),
      serverSelectionTimeoutMS: 10_000,
    },
    url: process.env.DATABASE_URL || '',
  }),
  editor: lexicalEditor(),
  // Sends emails such as "forgot password" through SendGrid when SENDGRID_API_KEY is set
  email: sendgridAdapter(),
  endpoints: [healthEndpoint],
  secret: process.env.PAYLOAD_SECRET || '',
  serverURL,
  sharp,
  storage: [s3StorageAdapter],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  upload: {
    limits: { fileSize: 50 * 1024 * 1024 },
    requestSizeLimit: 60 * 1024 * 1024,
  },
})
