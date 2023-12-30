import { mongooseAdapter } from '@payloadcms/db-mongodb'
// import { postgresAdapter } from '@payloadcms/db-postgres'
// import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload/config'
import { Users } from './collections/Users'
import { Settings } from './globals/Settings'

export default buildConfig({
  db: mongooseAdapter({
    url: process.env.DATABASE_URI,
  }),
  // db: postgresAdapter({
  //   pool: {
  //     connectionString: 'postgres://127.0.0.1:5432/payloadtests',
  //   },
  // }),
  // editor: lexicalEditor({}),
  secret: process.env.PAYLOAD_SECRET,
  collections: [Users],
  globals: [Settings],
  // onInit: async (payload) => {
  //   await payload.create({
  //     collection: 'users',
  //     data: {
  //       email: 'dev@payloadcms.com',
  //       password: 'test',
  //     },
  //   })
  // },
})
