import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import {
  BoldFeature,
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  ItalicFeature,
  LinkFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload/config'
import { fileURLToPath } from 'url'

import { Pages } from './_payload/collections/Pages'
import { Users } from './_payload/collections/Users'
import { MainMenu } from './_payload/globals/MainMenu'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import { seed } from '@/_payload/seed'

import BeforeLogin from './_payload/components/BeforeLogin'

export default buildConfig({
  admin: {
    components: {
      beforeLogin: [BeforeLogin],
    },
    user: Users.slug,
  },
  collections: [Pages, Users],
  // We need to set CORS rules pointing to our hosted domains for the frontend to be able to submit to our API
  cors: ['http://localhost:3000', 'http://localhost:3001'],
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  editor: lexicalEditor({
    features: () => {
      return [
        BoldFeature(),
        ItalicFeature(),
        LinkFeature({ enabledCollections: ['pages'] }),
        HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3'] }),
        FixedToolbarFeature(),
        InlineToolbarFeature(),
      ]
    },
  }),
  globals: [MainMenu],
  onInit: async (payload) => {
    if (process.env.PAYLOAD_SEED === 'true') {
      payload.logger.info('---- SEEDING DATABASE ----')
      await seed(payload)
    }
  },
  plugins: [
    formBuilderPlugin({
      fields: {
        payment: false,
      },
      formOverrides: {
        fields: [],
      },
    }),
  ],
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
