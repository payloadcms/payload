import { mongooseAdapter } from '@payloadcms/db-mongodb'
// import { postgresAdapter } from '@payloadcms/db-postgres'
// import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload/config'
import { Users } from './collections/Users'
import { Settings } from './globals/Settings'
import { Pages } from './collections/Pages'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { Media } from './collections/Media'
import path from 'path'

export default buildConfig({
  db: mongooseAdapter({
    url: process.env.DATABASE_URI,
  }),
  // db: postgresAdapter({
  //   pool: {
  //     connectionString: 'postgres://127.0.0.1:5432/payloadtests',
  //   },
  // }),
  secret: process.env.PAYLOAD_SECRET,
  collections: [Users, Pages, Media],
  globals: [Settings],
  editor: lexicalEditor({}),
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: 'dev@payloadcms.com',
        password: 'test',
      },
    })
    // const page = await payload.create({
    //   collection: 'pages',
    //   data: {
    //     title: 'Test Page',
    //   },
    // })
    //
    // await payload.update({
    //   collection: 'pages',
    //   id: page.id,
    //   data: {
    //     title: 'Test Page (Updated)',
    //   },
    // })
  },
  upload: {
    useTempFiles: true,
    tempFileDir: path.join(__dirname, '../temp'),
    limits: { fileSize: 200 * 1024 },
    abortOnLimit: true,
  },
})
