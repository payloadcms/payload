import type { Payload, Where } from 'payload'

import { logError } from 'payload'

type ReturnType = {
  id: string
  updatedAt: string
} | null

type Args = {
  parentID?: number | string
  payload: Payload
  slug: string
  status: 'draft' | 'published'
  type: 'collection' | 'global'
}
export async function getLatestVersion(args: Args): Promise<ReturnType> {
  const { slug, type = 'collection', parentID, payload, status } = args

  const and: Where[] = [
    {
      'version._status': {
        equals: status,
      },
    },
  ]

  if (type === 'collection' && parentID) {
    and.push({
      parent: {
        equals: parentID,
      },
    })
  }

  try {
    const sharedOptions = {
      depth: 0,
      limit: 1,
      sort: '-updatedAt',
      where: {
        and,
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
  } catch (err) {
    logError({ err, payload })

    return null
  }
}
