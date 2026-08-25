import type { Payload } from 'payload'

export async function updateWithoutStatus(payload: Payload) {
  return payload.update({
    id: '1',
    collection: 'posts',
    data: {
      title: 'Maybe publish',
    },
    draft: false,
  })
}
