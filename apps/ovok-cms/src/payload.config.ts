import { postgresAdapter } from '@payloadcms/db-postgres'
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Media } from './collections/Media'
import { Posts } from './collections/Posts'
import { Tenants } from './collections/Tenants'
import { Users } from './collections/Users'
import { schemaEndpoint } from './endpoints/schema'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL,
  secret: process.env.PAYLOAD_SECRET || '',
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || process.env.DATABASE_URL || '',
    },
  }),
  editor: lexicalEditor(),
  admin: {
    user: Users.slug,
    // Payload's bundled admin UI is permanently off. The Ovok Dashboard
    // (../ovok-dashboard) renders Payload-style CRUD forms client-side
    // using the schema returned by /_ovok/schema.
    disable: true,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Tenants, Media, Posts],
  plugins: [
    multiTenantPlugin({
      collections: {
        media: {},
        posts: {},
      },
      tenantField: {
        access: {
          // Tenant assignment is driven by the Ovok proxy via the
          // x-ovok-tenant-id header. Reject manual overrides on writes.
          update: () => false,
        },
      },
      tenantsArrayField: {
        includeDefaultField: false,
      },
      userHasAccessToAllTenants: () => false,
    }),
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  sharp,
  cors: '*',
  csrf: [],
  endpoints: [schemaEndpoint],
})
