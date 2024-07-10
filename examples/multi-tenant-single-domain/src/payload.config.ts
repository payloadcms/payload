import path from 'path'

import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'

import Users from './cms/collections/Users'
import { Tenants } from './cms/collections/Tenants'
import { TenantSelectorRSC } from './cms/components/TenantSelector/index'
import { Pages } from './cms/collections/Pages'

import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: 'users',
    components: {
      afterNavLinks: [TenantSelectorRSC],
    },
  },
  secret: process.env.PAYLOAD_SECRET as string,
  editor: lexicalEditor({}),
  collections: [Pages, Users, Tenants],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  graphQL: {
    schemaOutputFile: path.resolve(dirname, 'generated-schema.graphql'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI as string,
  }),
})
