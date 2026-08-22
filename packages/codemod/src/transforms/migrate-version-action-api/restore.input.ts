export async function restorePosts(payload) {
  const published = await payload.restoreVersion({
    id: '1',
    collection: 'posts',
    draft: false,
  })

  const draft = await payload.restoreVersion({
    id: '2',
    collection: 'posts',
    draft: true,
  })

  const globalPublished = await payload.restoreGlobalVersion({
    id: '3',
    slug: 'settings',
    draft: false,
  })

  return { draft, globalPublished, published }
}
