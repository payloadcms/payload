export async function updateWithoutStatus(payload) {
  return payload.update({
    id: '1',
    collection: 'posts',
    data: {
      title: 'Maybe publish',
    },
    draft: false,
  })
}
