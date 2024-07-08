import type { CollectionAfterChangeHook } from 'payload'

export const loginAfterCreate: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
  req: {
    data = {
      email: '',
      password: '',
    },
    payload,
    user = null,
  },
}) => {
  if (operation === 'create' && !user) {
    const { email, password } = data

    if (email && typeof email === 'string' && password && typeof password === 'string') {
      const { token, user } = await payload.login({
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
