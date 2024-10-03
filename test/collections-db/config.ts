import type { CollectionConfig } from '../../packages/payload/types'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'

export const doc = {
  id: 'abc123',
  name: 'Collection 1',
  customData: true,
}
export const doc2 = {
  id: 'abc456',
  name: 'Collection 2',
  customData: true,
}
export const docs = [doc]
export const docs2 = [doc2]

export let isInit = false
export const updateIsInit = (val: boolean) => {
  isInit = val
  return isInit
}

export let isConnected = false
export const updateIsConnect = (val: boolean) => {
  isConnected = val
  return isConnected
}

export const collectionSlug = 'collection-db'
export const collectionSlugRelated = 'collection-related-db'
const collectionWithDb = (slug: string, relatedCollection: string): CollectionConfig => {
  return {
    slug,
    db: {
      init: async () => {
        updateIsInit(true)
        return Promise.resolve()
      },
      connect: async () => {
        updateIsConnect(true)
        return Promise.resolve()
      },
      // @ts-expect-error
      create: () => {
        return slug === collectionSlug ? doc : doc2
      },
      // @ts-expect-error
      deleteOne: () => {
        return slug === collectionSlug ? doc : doc2
      },
      // @ts-expect-error
      deleteMany: () => {
        // Only used in deleteUserPreferences on user collections
        return slug === collectionSlug ? doc : doc2
      },
      // @ts-expect-error
      find: () => {
        return { docs: slug === collectionSlug ? docs : docs2 }
      },
      // @ts-expect-error
      findOne: () => {
        return slug === collectionSlug ? doc : doc2
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
      {
        name: 'otherCollection',
        type: 'relationship',
        relationTo: [relatedCollection],
      },
    ],
  }
}

export default buildConfigWithDefaults({
  // @ts-expect-error
  collections: [
    collectionWithDb(collectionSlug, collectionSlugRelated),
    collectionWithDb(collectionSlugRelated, collectionSlug),
  ],
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
