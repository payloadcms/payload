import type { CollectionConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { generateAllShapes, TAGS_SLUG } from './generate.js'
import { COLLECTION_COUNT } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const shapes = generateAllShapes(COLLECTION_COUNT)

const Users: CollectionConfig = {
  slug: 'users',
  admin: { useAsTitle: 'email' },
  auth: true,
  fields: [],
}

const Tags: CollectionConfig = {
  slug: TAGS_SLUG,
  admin: { hidden: true },
  fields: [{ name: 'name', type: 'text', required: true }],
}

export default buildConfigWithDefaults({
  admin: {
    importMap: { baseDir: path.resolve(dirname) },
  },
  collections: [Users, Tags, ...shapes.map((s) => s.config)],
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: { email: devUser.email, password: devUser.password },
    })

    for (let i = 0; i < 24; i++) {
      await payload.create({
        collection: TAGS_SLUG,
        data: { name: `tag-${i}` },
      })
    }
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
