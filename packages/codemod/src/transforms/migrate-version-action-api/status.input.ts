export async function writeWithStatus(payload) {
  const inferredDraft = await payload.create({
    collection: 'posts',
    data: {
      _status: 'draft',
      title: 'Already a draft',
    },
    draft: true,
  })

  const inferredPublish = await payload.update({
    id: inferredDraft.id,
    collection: 'posts',
    data: {
      _status: 'published',
      title: 'Publish me',
    },
    draft: false,
  })

  return { inferredDraft, inferredPublish }
}
