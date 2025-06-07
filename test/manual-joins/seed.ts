import type { Payload } from 'payload'

export const seed = async (payload: Payload) => {
  await payload.create({
    collection: 'users',
    data: {
      email: 'test@example.com',
      password: 'test',
    },
  })
  const category = await payload.create({
    collection: 'categories',
    data: { name: 'category' },
  })

  for (let i = 0; i < 15; i++) {
    await payload.create({
      collection: 'posts',
      data: {
        title: `test ${i}`,
        category: category.id,
      },
    })
  }
}
