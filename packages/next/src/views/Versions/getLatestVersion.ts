import type { Payload, PayloadRequest, Where } from 'payload'

import { logError } from 'payload'

type ReturnType = {
  id: string
  updatedAt: string
} | null

type Args = {
  locale?: string
  overrideAccess?: boolean
  parentID?: number | string
  payload: Payload
  req?: PayloadRequest
  slug: string
  status: 'draft' | 'published'
  type: 'collection' | 'global'
}
export async function getLatestVersion(args: Args): Promise<ReturnType> {
  const { slug, type = 'collection', locale, overrideAccess, parentID, payload, req, status } = args

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
      locale,
      overrideAccess,
      req,
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
