import type { Payload } from 'payload'

export async function restorePosts(payload: Payload) {
  const published = await payload.restoreVersion({
    id: '1',
    collection: 'posts',
    action: 'publish',
  })

  const draft = await payload.restoreVersion({
    id: '2',
    collection: 'posts',
    action: 'saveDraft',
  })

  const globalPublished = await payload.restoreGlobalVersion({
    id: '3',
    slug: 'settings',
    action: 'publish',
  })

  return { draft, globalPublished, published }
}
