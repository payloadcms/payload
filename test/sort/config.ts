import type { CollectionSlug, Payload } from 'payload'

import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { DefaultSortCollection } from './collections/DefaultSort/index.js'
import { DraftsCollection } from './collections/Drafts/index.js'
import { LocalizedCollection } from './collections/Localized/index.js'
import { PostsCollection } from './collections/Posts/index.js'
import { SortableCollection } from './collections/Sortable/index.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  collections: [
    PostsCollection,
    DraftsCollection,
    DefaultSortCollection,
    LocalizedCollection,
    SortableCollection,
  ],
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  endpoints: [
    {
      path: '/seed',
      method: 'post',
      handler: async (req) => {
        await seedSortable(req.payload)
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        })
      },
    },
  ],
  cors: ['http://localhost:3000', 'http://localhost:3001'],
  localization: {
    locales: ['en', 'nb'],
    defaultLocale: 'en',
  },
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
    await seedSortable(payload)
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})

export async function createData(
  payload: Payload,
  collection: CollectionSlug,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>[],
) {
  for (const item of data) {
    await payload.create({ collection, data: item })
  }
}

async function seedSortable(payload: Payload) {
  await payload.delete({ collection: 'sortable', where: {} })
  await createData(payload, 'sortable', [
    { title: 'Sortable 1' },
    { title: 'Sortable 2' },
    { title: 'Sortable 3' },
    { title: 'Sortable 4' },
  ])
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  })
}
