export async function getLatestVersion(payload, slug, status, type = 'collection') {
  try {
    const sharedOptions = {
      depth: 0,
      limit: 1,
      sort: '-updatedAt',
      where: {
        'version._status': {
          equals: status,
        },
      },
    }

    const response =
      type === 'collection'
        ? await payload.findVersions({
            collection: slug,
            ...sharedOptions,
          })
        : await payload.findGlobalVersions({
            slug,
            ...sharedOptions,
          })

    return {
      id: response.docs[0].id,
      updatedAt: response.docs[0].updatedAt,
    }
  } catch (e) {
    console.error(e)
  }
}
