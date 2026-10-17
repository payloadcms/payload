import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { AutosavePostsCollection, DraftPostsCollection } from './collections/Autosave/index.js'
import { ConditionsCollection } from './collections/Conditions/index.js'
import { PostsCollection, postsSlug } from './collections/Posts/index.js'
import { UploadsCollection } from './collections/Uploads/index.js'
import { permissionSettingsSlug } from './slugs.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  config: {
    admin: {
      components: {
        views: {
          formRequests: {
            Component: './components/FormRequests/index.js#FormRequests',
            path: '/form-requests',
          },
          permissionRequests: {
            Component: './components/PermissionRequests/index.js#PermissionRequests',
            path: '/permission-requests',
          },
        },
      },
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [
      PostsCollection,
      AutosavePostsCollection,
      DraftPostsCollection,
      ConditionsCollection,
      UploadsCollection,
    ],
    globals: [{ slug: permissionSettingsSlug, fields: [{ name: 'title', type: 'text' }] }],
    localization: { defaultLocale: 'en', locales: ['en', 'fr'] },
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  },
  seed: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
      overrideAccess: true,
    })

    await payload.create({
      collection: postsSlug,
      data: {
        title: 'example post',
      },
      overrideAccess: true,
    })
  },
  suite: 'form-state',
})
