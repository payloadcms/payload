import type { CollectionAfterChangeHook } from 'payload'

export const loginAfterCreate: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation === 'create' && req.body) {
    const { email, password } = req.data as {
      email: string
      password: string
    }

    if (email && password) {
      const { token, user } = await req.payload.login({
        collection: 'users',
        data: { email, password },
        req,
      })

      return {
        ...doc,
        token,
        user,
      }
    }
  }

  return doc
}
