import type { Payload } from 'payload'

export const seed = async (payload: Payload): Promise<void> => {
  await payload.create({
    collection: 'users',
    data: {
      email: 'dev@payloadcms.com',
      password: 'test',
      roles: ['admin'],
    },
  })
}
