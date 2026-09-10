import type { Payload } from 'payload'

export async function writePosts(payload: Payload) {
  const draft = await payload.create({
    collection: 'posts',
    data: {
      title: 'Draft post',
    },
    action: 'saveDraft',
  })

  const published = await payload.create({
    collection: 'posts',
    data: {
      title: 'Published post',
    },
    action: 'publish',
  })

  const updated = await payload.update({
    id: draft.id,
    collection: 'posts',
    data: {
      title: 'Updated draft',
    },
    action: 'saveDraft',
  })

  const copy = await payload.duplicate({
    id: published.id,
    collection: 'posts',
    action: 'saveDraft',
  })

  return { copy, draft, published, updated }
}
