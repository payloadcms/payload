import type { Payload } from 'payload'

import { devUser } from '../../credentials.js'

export const seed = async (payload: Payload) => {
  const { totalDocs } = await payload.count({
    overrideAccess: true,
    collection: 'users',
    where: {
      email: {
        equals: devUser.email,
      },
    },
  })

  if (!totalDocs) {
    await payload.create({
      overrideAccess: true,
      collection: 'users',
      data: devUser,
    })
  }
}
