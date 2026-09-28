import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { mcpPlugin } from '@payloadcms/plugin-mcp'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Folders } from './collections/Folders'
import { Tags } from './collections/Tags'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    dashboard: {
      defaultLayout: [
        { widgetSlug: 'welcome', width: 'full' },
        { widgetSlug: 'collections', width: 'full' },
        { widgetSlug: 'activity', width: 'small' },
      ],
      widgets: [
        {
          slug: 'welcome',
          Component: './components/Welcome/index.tsx#WelcomeWidget',
          maxWidth: 'full',
          minWidth: 'full',
          label: 'Welcome',
        },
      ],
    },
  },
  collections: [Users, Media, Folders, Tags],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URL || '',
  }),
  sharp,
  localization: {
    locales: ['en'],
    fallback: true,
    defaultLocale: 'en',
  },
  plugins: [mcpPlugin({})],
})
