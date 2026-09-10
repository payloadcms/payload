import type { Payload } from 'payload'

export async function writeWithStatus(payload: Payload) {
  const inferredDraft = await payload.create({
    collection: 'posts',
    data: {
      _status: 'draft',
      title: 'Already a draft',
    }
  })

  const inferredPublish = await payload.update({
    id: inferredDraft.id,
    collection: 'posts',
    data: {
      _status: 'published',
      title: 'Publish me',
    }
  })

  return { inferredDraft, inferredPublish }
}
