import type { Payload } from 'payload'

export async function writePosts(payload: Payload) {
  const draft = await payload.create({
    collection: 'posts',
    data: {
      title: 'Draft post',
    },
    draft: true,
  })

  const published = await payload.create({
    collection: 'posts',
    data: {
      title: 'Published post',
    },
    draft: false,
  })

  const updated = await payload.update({
    id: draft.id,
    collection: 'posts',
    data: {
      title: 'Updated draft',
    },
    draft: true,
  })

  const copy = await payload.duplicate({
    id: published.id,
    collection: 'posts',
    draft: true,
  })

  return { copy, draft, published, updated }
}
