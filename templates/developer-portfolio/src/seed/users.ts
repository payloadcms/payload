import payload from 'payload'

export const seedUsers = async (): Promise<void> => {
  // create admin
  await payload.create({
    collection: 'users',
    data: {
      email: 'dev@payloadcms.com',
      password: 'test',
    },
  })
}
