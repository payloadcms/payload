export async function alreadyMigrated(payload) {
  const latest = await payload.find({
    collection: 'posts',
    version: 'latest',
  })

  const created = await payload.create({
    collection: 'posts',
    action: 'saveDraft',
    data: {
      title: 'Hi',
    },
  })

  return { created, latest }
}
