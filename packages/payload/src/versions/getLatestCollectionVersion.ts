import type { SanitizedCollectionConfig, TypeWithID } from '../collections/config/types'
import type { FindOneArgs } from '../database/types'
import type { Payload } from '../payload'
import type { PayloadRequest } from '../types'
import type { TypeWithVersion } from './types'

import { docHasTimestamps } from '../types'

type Args = {
  config: SanitizedCollectionConfig
  id: number | string
  payload: Payload
  query: FindOneArgs
  req?: PayloadRequest
}

export const getLatestCollectionVersion = async <T extends TypeWithID = any>({
  id,
  config,
  payload,
  query,
  req,
}: Args): Promise<T> => {
  let latestVersion: TypeWithVersion<T>

  const hasConfigDb = Object.keys(config?.db ? config?.db : {}).length > 0

  if (config.versions?.drafts && !hasConfigDb) {
    const { docs } = await payload.db.findVersions<T>({
      collection: config.slug,
      limit: 1,
      pagination: false,
      req,
      sort: '-updatedAt',
      where: { parent: { equals: id } },
    })
    ;[latestVersion] = docs
  }

  let doc
  if (config?.db?.findOne) {
    doc = await config.db.findOne<T>({ ...query, req })
  } else {
    doc = await payload.db.findOne<T>({ ...query, req })
  }

  if (!latestVersion || (docHasTimestamps(doc) && latestVersion.updatedAt < doc.updatedAt)) {
    return doc
  }

  return {
    ...latestVersion.version,
    id,
    createdAt: latestVersion.createdAt,
    updatedAt: latestVersion.updatedAt,
  }
}
