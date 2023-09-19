import payload from 'payload'

export const seedUsers = async (): Promise<void> => {
  await payload.delete({
    collection: 'users',
    where: {
      email: {
        equals: 'dev@payloadcms.com',
      },
    },
  })

  // create admin
  await payload.create({
    collection: 'users',
    data: {
      email: 'dev@payloadcms.com',
      password: 'test',
    },
  })
}
