import type { Config } from 'payload'

import { fileURLToPath } from 'node:url'
import path from 'path'
import { definePlugin } from 'payload'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const pagesSlug = 'pages'

export type ReaderPluginOptions = {
  items: Array<{ name: string }>
}

declare module 'payload' {
  interface RegisteredPlugins {
    'priority-reader': ReaderPluginOptions
  }
}

/**
 * Plugin with order 10 (runs second) that reads both its own options and config.custom.
 * Other plugins can inject additional items into its options via slug discovery.
 */
const readerPlugin = definePlugin<ReaderPluginOptions>({
  slug: 'priority-reader',
  order: 10,
  plugin: ({ config, items }): Config => ({
    ...config,
    custom: {
      ...(config.custom || {}),
      readerSawValue: (config.custom?.writerValue as string) ?? null,
      readerItems: items.map((i) => i.name),
    },
  }),
})

/**
 * Plugin with order 1 (runs first) that writes to config.custom and injects items
 * into the reader plugin's options via typed slug discovery.
 */
const writerPlugin = definePlugin({
  slug: 'priority-writer',
  order: 1,
  plugin: ({ config, plugins }): Config => {
    const reader = plugins['priority-reader']
    if (reader?.options) {
      reader.options.items.push({ name: 'injected-by-writer' })
    }

    return {
      ...config,
      custom: {
        ...(config.custom || {}),
        writerValue: 'written-by-low-priority',
      },
    }
  },
})

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
    // Intentionally listed BEFORE the writer to verify order sorting works
    readerPlugin({ items: [{ name: 'user-provided' }] }),
    writerPlugin(),
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
