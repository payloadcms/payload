import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  collections: [
    {
      slug: 'posts',
      fields: [
        {
          type: 'text',
          name: 'title',
        },
      ],
    },
  ],
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
    postProcess: [
      ({ compiledTypes }) => {
        const genericType = `export type TestPluginGeneric<T> = { value: T };`
        // Insert after banner comment
        return compiledTypes.replace(/(\/\*[\s\S]*?\*\/\n)/, `$1\n${genericType}\n`)
      },
      ({ compiledTypes }) => {
        // Second function adds another type after the first
        return compiledTypes.replace(
          'export type TestPluginGeneric<T>',
          'export type SecondGeneric<K, V> = { key: K; value: V };\nexport type TestPluginGeneric<T>',
        )
      },
    ],
  },
})
