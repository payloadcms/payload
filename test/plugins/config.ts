import type { Config, Plugin } from 'payload'

import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const pagesSlug = 'pages'

type ReaderPluginOptions = {
  items: Array<{ name: string }>
}

/**
 * High-priority plugin that reads both its own options and config.custom.
 * Other plugins can inject additional items into its options via slug discovery.
 */
const readerPlugin = (pluginOptions: ReaderPluginOptions): Plugin => {
  const plugin: Plugin = (config: Config): Config => ({
    ...config,
    custom: {
      ...(config.custom || {}),
      readerSawValue: (config.custom?.writerValue as string) ?? null,
      readerItems: pluginOptions.items.map((i) => i.name),
    },
  })

  plugin.slug = 'priority-reader'
  plugin.priority = 10
  plugin.options = pluginOptions

  return plugin
}

/**
 * Low-priority plugin that writes to config.custom and injects items
 * into the reader plugin's options via slug discovery.
 */
const writerPlugin = (): Plugin => {
  const plugin: Plugin = (config: Config): Config => {
    const reader = config.plugins?.find((p) => p.slug === 'priority-reader')
    if (reader?.options) {
      const opts = reader.options as unknown as ReaderPluginOptions
      opts.items.push({ name: 'injected-by-writer' })
    }

    return {
      ...config,
      custom: {
        ...(config.custom || {}),
        writerValue: 'written-by-low-priority',
      },
    }
  }

  plugin.priority = 1
  plugin.slug = 'priority-writer'

  return plugin
}

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
    // Intentionally listed BEFORE the writer to verify priority sorting works
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
