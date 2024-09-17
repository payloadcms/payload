import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'

export const doc = {
  id: -1,
  customData: true,
}
export const docs = [doc]

export const globalSlug = 'global-db'

let noGlobal = false
export const updateNoGlobal = (val: boolean) => {
  noGlobal = val
  return noGlobal
}
export default buildConfigWithDefaults({
  globals: [
    {
      slug: globalSlug,
      db: {
        init: () => {
          return Promise.resolve()
        },
        // @ts-expect-error
        createGlobal: ({ slug, data, req }) => {
          return { ...doc, created: true }
        },
        // @ts-expect-error
        updateGlobal: ({ slug, data, req }) => {
          return { ...doc, updated: true }
        },
        // @ts-expect-error
        findGlobal: () => {
          if (noGlobal) return false
          return doc
        },
        // @ts-expect-error
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
