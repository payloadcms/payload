import type { CollectionConfig } from '../../packages/payload/types'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'

export const doc = {
  id: -1,
  customData: true,
}
export const docs = [doc]

export let isInit = false
export const updateIsInit = (val: boolean) => {
  isInit = val
  return isInit
}

export let isConnect = false
export const updateIsConnect = (val: boolean) => {
  isConnect = val
  return isConnect
}
const collectionWithDb = (collectionSlug: string): CollectionConfig => {
  return {
    slug: collectionSlug,
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
        return doc
      },
      // @ts-expect-error
      deleteOne: () => {
        return docs
      },
      // @ts-expect-error
      deleteMany: () => {
        // Only used in deleteUserPreferences on user collections
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
