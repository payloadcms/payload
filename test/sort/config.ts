import type { CollectionSlug, Payload } from 'payload'

import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { DefaultSortCollection } from './collections/DefaultSort/index.js'
import { DraftsCollection } from './collections/Drafts/index.js'
import { LocalizedCollection } from './collections/Localized/index.js'
import { PostsCollection } from './collections/Posts/index.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  collections: [PostsCollection, DraftsCollection, DefaultSortCollection, LocalizedCollection],
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
        await req.payload.delete({ collection: 'posts', where: {} })
        await createData(req.payload, 'posts', [
          { text: 'Post 1' },
          { text: 'Post 2' },
          { text: 'Post 3' },
          { text: 'Post 4' },
          { text: 'Post 5' },
          { text: 'Post 6' },
          { text: 'Post 7' },
          { text: 'Post 8' },
          { text: 'Post 9' },
        ])
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
    await createData(payload, 'posts', [
      { text: 'Post 1', number: 1, number2: 10, group: { number: 100 } },
      { text: 'Post 2', number: 2, number2: 10, group: { number: 200 } },
      { text: 'Post 3', number: 3, number2: 5, group: { number: 150 } },
      { text: 'Post 10', number: 10, number2: 5, group: { number: 200 } },
      { text: 'Post 11', number: 11, number2: 20, group: { number: 150 } },
      { text: 'Post 12', number: 12, number2: 20, group: { number: 100 } },
    ])
    await createData(payload, 'default-sort', [
      { text: 'Post default-5 b', number: 5 },
      { text: 'Post default-10', number: 10 },
      { text: 'Post default-5 a', number: 5 },
      { text: 'Post default-1', number: 1 },
    ])
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
