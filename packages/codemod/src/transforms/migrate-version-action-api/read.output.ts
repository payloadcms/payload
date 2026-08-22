export async function loadPosts(payload) {
  const latest = await payload.find({
    collection: 'posts',
    // fetch the newest draft when one exists
    version: 'latest',
    limit: 10,
  })

  const published = await payload.findByID({
    id: '1',
    collection: 'posts',
    version: 'published',
  })

  const globalLatest = await payload.findGlobal({
    slug: 'settings',
    version: 'latest',
  })

  const counted = await payload.count({
    collection: 'posts',
    version: 'published',
  })

  return { counted, globalLatest, latest, published }
}
