import type { CollectionConfig } from 'payload/dist/collections/config/types'

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
      create: () => {
        return doc
      },
      deleteOne: () => {
        return docs
      },
      // Only used in deleteUserPreferences on user collections
      deleteMany: () => {
        return docs
      },
      find: () => {
        return { docs }
      },
      findOne: () => {
        return doc
      },
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
