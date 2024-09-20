import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'

export const doc = {
  id: 'abc123',
  customData: true,
}
export const docs = [doc]

export const globalSlug = 'global-db'

let noGlobal = false
export const updateNoGlobal = (val: boolean) => {
  noGlobal = val
  return noGlobal
}

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
export default buildConfigWithDefaults({
  globals: [
    {
      slug: globalSlug,
      db: {
        init: async () => {
          updateIsInit(true)
          return Promise.resolve()
        },
        connect: async () => {
          updateIsConnect(true)
          return Promise.resolve()
        },
        // @ts-expect-error no async
        createGlobal: ({ slug, data, req }) => {
          return { ...doc, created: true }
        },
        // @ts-expect-error no async
        updateGlobal: ({ slug, data, req }) => {
          return { ...doc, updated: true }
        },
        // @ts-expect-error no async
        findGlobal: () => {
          if (noGlobal) {
            return false
          }
          return doc
        },
        // @ts-expect-error no async
        findGlobalVersions: () => {
          return { docs }
        },
      },
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
    },
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
})
