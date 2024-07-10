import type { CollectionAfterChangeHook } from 'payload'

export const loginAfterCreate: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
  req: { body = {}, payload },
}) => {
  if (operation === 'create' && !req.user) {
    // @ts-expect-error
    const { email, password } = body

    if (email && password) {
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
