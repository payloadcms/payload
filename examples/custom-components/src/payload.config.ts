import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'

import { CustomFields } from './collections/Fields'
import { CustomRootViews } from './collections/RootViews'
import { CustomViews } from './collections/Views'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// eslint-disable-next-line no-restricted-exports
export default buildConfig({
  admin: {
    components: {
      afterNavLinks: [
        '@/components/afterNavLinks/LinkToCustomView#LinkToCustomView',
        '@/components/afterNavLinks/LinkToCustomMinimalView#LinkToCustomMinimalView',
        '@/components/afterNavLinks/LinkToCustomDefaultView#LinkToCustomDefaultView',
      ],
      views: {
        CustomRootView: {
          Component: '@/components/views/CustomRootView#CustomRootView',
          path: '/custom',
        },
        DefaultCustomView: {
          Component: '@/components/views/CustomDefaultRootView#CustomDefaultRootView',
          path: '/custom-default',
        },
        MinimalCustomView: {
          Component: '@/components/views/CustomMinimalRootView#CustomMinimalRootView',
          path: '/custom-minimal',
        },
      },
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [CustomFields, CustomViews, CustomRootViews],
  db: mongooseAdapter({
    url: process.env.DATABASE_URI as string,
  }),
  editor: lexicalEditor({}),
  graphQL: {
    schemaOutputFile: path.resolve(dirname, 'generated-schema.graphql'),
  },
  secret: process.env.PAYLOAD_SECRET as string,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
