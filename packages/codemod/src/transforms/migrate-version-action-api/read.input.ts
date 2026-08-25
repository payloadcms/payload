import type { Payload } from 'payload'

export async function loadPosts(payload: Payload) {
  const latest = await payload.find({
    collection: 'posts',
    // fetch the newest draft when one exists
    draft: true,
    limit: 10,
  })

  const published = await payload.findByID({
    id: '1',
    collection: 'posts',
    draft: false,
  })

  const globalLatest = await payload.findGlobal({
    slug: 'settings',
    draft: true,
  })

  const counted = await payload.count({
    collection: 'posts',
    draft: false,
  })

  return { counted, globalLatest, latest, published }
}
