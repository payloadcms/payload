import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const pagesSlug = 'pages'
export const afterPluginSlug = 'after-plugin-pages'

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    {
      slug: 'users',
      auth: true,
      fields: [],
    },
  ],
  plugins: [
    (config) => {
      return {
        ...config,
        afterPlugins: [
          ...(config.afterPlugins || []),
          (finalConfig) => {
            const hasPages = finalConfig.collections?.some((c) => c.slug === pagesSlug)

            return {
              ...finalConfig,
              collections: [
                ...(finalConfig.collections || []),
                {
                  slug: afterPluginSlug,
                  fields: [
                    {
                      name: 'title',
                      type: 'text' as const,
                    },
                    {
                      name: 'discoveredPages',
                      type: 'checkbox' as const,
                      defaultValue: hasPages,
                    },
                  ],
                },
              ],
            }
          },
        ],
        collections: [
          ...(config.collections || []),
          {
            slug: pagesSlug,
            fields: [
              {
                name: 'title',
                type: 'text',
              },
            ],
          },
        ],
      }
    },
  ],
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
