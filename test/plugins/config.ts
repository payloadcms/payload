import { fileURLToPath } from 'node:url'
import path from 'path'

import type { Plugin } from 'payload'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const pagesSlug = 'pages'

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
    (config) => ({
      ...config,
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
    }),
    // High-priority plugin runs last — reads config.custom written by the low-priority plugin.
    // Intentionally listed BEFORE the writer in the array to verify priority sorting works.
    (() => {
      const reader: Plugin = (config) => ({
        ...config,
        custom: {
          ...(config.custom || {}),
          readerSawValue: (config.custom?.writerValue as string) ?? null,
        },
      })
      reader.slug = 'priority-reader'
      reader.priority = 10
      return reader
    })(),
    // Low-priority plugin runs first — writes to config.custom
    (() => {
      const writer: Plugin = (config) => ({
        ...config,
        custom: {
          ...(config.custom || {}),
          writerValue: 'written-by-low-priority',
        },
      })
      writer.slug = 'priority-writer'
      writer.priority = 1
      return writer
    })(),
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
