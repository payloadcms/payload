import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload/config'
import { fileURLToPath } from 'url'

import { Events } from './collections/Events'
import { Locations } from './collections/Location'
import { Staff } from './collections/Staff'
import { Users } from './collections/Users'
import { BeforeLogin } from './components/BeforeLogin'
import { seedData } from './seed'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    components: {
      beforeLogin: [BeforeLogin],
    },
    user: Users.slug,
  },
  collections: [Events, Locations, Staff, Users],
  editor: lexicalEditor({}),
  serverURL: 'http://localhost:3000',
  // plugins: [payloadCloud()], // TODO: Re-enable when cloud supports 3.0
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  onInit: async (payload) => {
    await seedData(payload)
  },
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
