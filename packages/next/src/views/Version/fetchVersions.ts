import {
  logError,
  type PaginatedDocs,
  type PayloadRequest,
  type SelectType,
  type Sort,
  type TypedUser,
  type TypeWithVersion,
  type Where,
} from '@ruya.sa/payload'

export const fetchVersion = async <TVersionData extends object = object>({
  id,
  collectionSlug,
  depth,
  globalSlug,
  locale,
  overrideAccess,
  req,
  select,
  user,
}: {
  collectionSlug?: string
  depth?: number
  globalSlug?: string
  id: number | string
  locale?: 'all' | ({} & string)
  overrideAccess?: boolean
  req: PayloadRequest
  select?: SelectType
  user?: TypedUser
}): Promise<null | TypeWithVersion<TVersionData>> => {
  try {
    if (collectionSlug) {
      return (await req.payload.findVersionByID({
        id: String(id),
        collection: collectionSlug,
        depth,
        locale,
        overrideAccess,
        req,
        select,
        user,
      })) as TypeWithVersion<TVersionData>
    } else if (globalSlug) {
      return (await req.payload.findGlobalVersionByID({
        id: String(id),
        slug: globalSlug,
        depth,
        locale,
        overrideAccess,
        req,
        select,
        user,
      })) as TypeWithVersion<TVersionData>
    }
  } catch (err) {
    logError({ err, payload: req.payload })
    return null
  }
}

export const fetchVersions = async <TVersionData extends object = object>({
  collectionSlug,
  depth,
  draft,
  globalSlug,
  limit,
  locale,
  overrideAccess,
  page,
  parentID,
  req,
  select,
  sort,
  user,
  where: whereFromArgs,
}: {
  collectionSlug?: string
  depth?: number
  draft?: boolean
  globalSlug?: string
  limit?: number
  locale?: 'all' | ({} & string)
  overrideAccess?: boolean
  page?: number
  parentID?: number | string
  req: PayloadRequest
  select?: SelectType
  sort?: Sort
  user?: TypedUser
  where?: Where
}): Promise<null | PaginatedDocs<TypeWithVersion<TVersionData>>> => {
  const where: Where = { and: [...(whereFromArgs ? [whereFromArgs] : [])] }

  try {
    if (collectionSlug) {
      if (parentID) {
        where.and.push({
          parent: {
            equals: parentID,
          },
        })
      }
      return (await req.payload.findVersions({
        collection: collectionSlug,
        depth,
        draft,
        limit,
        locale,
        overrideAccess,
        page,
        req,
        select,
        sort,
        user,
        where,
      })) as PaginatedDocs<TypeWithVersion<TVersionData>>
    } else if (globalSlug) {
      return (await req.payload.findGlobalVersions({
        slug: globalSlug,
        depth,
        limit,
        locale,
        overrideAccess,
        page,
        req,
        select,
        sort,
        user,
        where,
      })) as PaginatedDocs<TypeWithVersion<TVersionData>>
    }
  } catch (err) {
    logError({ err, payload: req.payload })

    return null
  }
}

export const fetchLatestVersion = async <TVersionData extends object = object>({
  collectionSlug,
  depth,
  globalSlug,
  locale,
  overrideAccess,
  parentID,
  req,
  select,
  status,
  user,
  where,
}: {
  collectionSlug?: string
  depth?: number
  globalSlug?: string
  locale?: 'all' | ({} & string)
  overrideAccess?: boolean
  parentID?: number | string
  req: PayloadRequest
  select?: SelectType
  status: 'draft' | 'published'
  user?: TypedUser
  where?: Where
}): Promise<null | TypeWithVersion<TVersionData>> => {
  // Get the entity config to check if drafts are enabled
  const entityConfig = collectionSlug
    ? req.payload.collections[collectionSlug]?.config
    : globalSlug
      ? req.payload.globals[globalSlug]?.config
      : undefined

  // Only query by _status if drafts are enabled (since _status field only exists with drafts)
  const draftsEnabled = entityConfig?.versions?.drafts

  const and: Where[] = [
    ...(draftsEnabled
      ? [
          {
            'version._status': {
              equals: status,
            },
          },
        ]
      : []),
    ...(where ? [where] : []),
  ]

  const latest = await fetchVersions({
    collectionSlug,
    depth,
    draft: true,
    globalSlug,
    limit: 1,
    locale,
    overrideAccess,
    parentID,
    req,
    select,
    sort: '-updatedAt',
    user,
    where: { and },
  })

  return latest?.docs?.length ? (latest.docs[0] as TypeWithVersion<TVersionData>) : null
}
