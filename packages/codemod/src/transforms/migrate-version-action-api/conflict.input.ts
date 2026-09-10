import type { Payload } from 'payload'

export async function conflicts(payload: Payload) {
  const read = await payload.find({
    collection: 'posts',
    draft: true,
    version: 'published',
  })

  const write = await payload.update({
    id: '1',
    action: 'publish',
    collection: 'posts',
    data: {
      title: 'Conflict',
    },
    draft: true,
  })

  return { read, write }
}
