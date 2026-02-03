import type { Payload } from 'payload'

import { devUser } from '@tools/test-utils/shared'

export const _seed = async (_payload: Payload) => {
  await _payload.create({
    collection: 'users',
    data: {
      email: devUser.email,
      password: devUser.password,
    },
  })
}

export async function seed(_payload: Payload) {
  return await _seed(_payload)
}
