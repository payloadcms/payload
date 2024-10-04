import type { SanitizedCollectionConfig, TypeWithID } from '../collections/config/types.js'
import type { FindOneArgs } from '../database/types.js'
import type { Payload, PayloadRequest } from '../types/index.js'
import type { TypeWithVersion } from './types.js'

type Args = {
  config: SanitizedCollectionConfig
  id: number | string
  payload: Payload
  published?: boolean
  query: FindOneArgs
  req?: PayloadRequest
}

export const getLatestCollectionVersion = async <T extends TypeWithID = any>({
  id,
  config,
  payload,
  published,
  query,
  req,
}: Args): Promise<T> => {
  let latestVersion: TypeWithVersion<T>

  const whereQuery = published
    ? { and: [{ parent: { equals: id } }, { 'version._status': { equals: 'published' } }] }
    : { and: [{ parent: { equals: id } }, { latest: { equals: true } }] }

  if (config.versions?.drafts) {
    const findVersionsDbArgs = {
      collection: config.slug,
      limit: 1,
      pagination: false,
      req,
      sort: '-updatedAt',
      where: whereQuery,
    }
    let result: any
    // @ts-expect-error exists
    if (config?.db?.findVersions) {
      // @ts-expect-error exists
      result = await config.db.findVersions<T>(findVersionsDbArgs)
    } else {
      result = await payload.db.findVersions<T>(findVersionsDbArgs)
    }
    const docs = result.docs
    ;[latestVersion] = docs
  }

  if (!latestVersion) {
    if (!published) {
      let doc
      // @ts-expect-error exists
      if (config?.db?.findOne) {
        // @ts-expect-error exists
        doc = await config.db.findOne<T>({ ...query, req })
      } else {
        doc = await payload.db.findOne<T>({ ...query, req })
      }
      return doc
    }

    return undefined
  }

  return {
    ...latestVersion.version,
    id,
    createdAt: latestVersion.createdAt,
    updatedAt: latestVersion.updatedAt,
  }
}
