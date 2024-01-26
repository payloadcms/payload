import type { AfterLoginHook } from '../../../../packages/payload/src/collections/config/types'

export const afterLoginHook: AfterLoginHook = async ({ req, user }) => {
  return req.payload.update({
    id: user.id,
    collection: 'hooks-users',
    data: {
      afterLoginHook: true,
    },
    req,
  })
}
