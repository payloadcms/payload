import type { CollectionConfig } from '../../packages/payload/types'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'

export const doc = {
  id: -1,
  customData: true,
}
export const docs = [doc]

const collectionWithDb = (collectionSlug: string): CollectionConfig => {
  return {
    slug: collectionSlug,
    db: {
      // @ts-expect-error
      create: () => {
        return doc
      },
      // @ts-expect-error
      deleteOne: () => {
        return docs
      },
      // Only used in deleteUserPreferences on user collections
      // @ts-expect-error
      deleteMany: () => {
        return docs
      },
      // @ts-expect-error
      find: () => {
        return { docs }
      },
      // @ts-expect-error
      findOne: () => {
        return doc
      },
      // @ts-expect-error
      updateOne: () => {
        return { ...doc, updated: true }
      },
    },
    fields: [
      {
        name: 'name',
        type: 'text',
      },
    ],
  }
}

export const collectionSlug = 'collection-db'
export default buildConfigWithDefaults({
  // @ts-expect-error
  collections: [collectionWithDb(collectionSlug)],
  graphQL: {
    schemaOutputFile: './test/collections-db/schema.graphql',
  },

  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
  },
})
