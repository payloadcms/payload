import type { Payload, PayloadRequest, TypeWithVersion, Where } from 'payload'

import { logError } from 'payload'

export type GetLatestVersionReturnType = null | TypeWithVersion<any>

type Args = {
  additionalWheres?: Where[]
  locale?: string
  overrideAccess?: boolean
  parentID?: number | string
  payload: Payload
  req?: PayloadRequest
  slug: string
  status: 'draft' | 'published'
  type: 'collection' | 'global'
}
export async function getLatestVersion(args: Args): Promise<GetLatestVersionReturnType> {
  const {
    slug,
    type = 'collection',
    additionalWheres,
    locale,
    overrideAccess,
    parentID,
    payload,
    req,
    status,
  } = args

  const and: Where[] = [
    {
      'version._status': {
        equals: status,
      },
    },
    ...(additionalWheres || []),
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

    return response.docs[0]
  } catch (err) {
    logError({ err, payload })

    return null
  }
}
