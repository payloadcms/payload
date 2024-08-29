import type { Payload } from 'payload'

type ReturnType = {
  id: string
  updatedAt: string
} | null

type Args = {
  payload: Payload
  slug: string
  status: 'draft' | 'published'
  type: 'collection' | 'global'
}
export async function getLatestVersion(args: Args): Promise<ReturnType> {
  const { slug, type = 'collection', payload, status } = args

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

    if (!response.docs.length) {
      return null
    }

    return {
      id: response.docs[0].id,
      updatedAt: response.docs[0].updatedAt,
    }
  } catch (e) {
    console.error(e)
    return null
  }
}
