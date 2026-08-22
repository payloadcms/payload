export async function statusConflicts(payload) {
  const publishMany = await payload.update({
    id: '1',
    collection: 'posts',
    data: {
      _status: 'published',
      title: 'Publish many',
    },
    draft: true,
  })

  const createMismatch = await payload.create({
    collection: 'posts',
    data: {
      _status: 'draft',
      title: 'Create mismatch',
    },
    draft: false,
  })

  return { createMismatch, publishMany }
}
