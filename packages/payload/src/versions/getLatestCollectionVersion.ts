import type { SanitizedCollectionConfig, TypeWithID } from '../collections/config/types.js'
import type { FindOneArgs } from '../database/types.js'
import type { Payload, PayloadRequestWithData } from '../types/index.js'
import type { TypeWithVersion } from './types.js'

import { docHasTimestamps } from '../types/index.js'

type Args = {
  config: SanitizedCollectionConfig
  id: number | string
  payload: Payload
  query: FindOneArgs
  req?: PayloadRequestWithData
}

export const getLatestCollectionVersion = async <T extends TypeWithID = any>({
  id,
  config,
  payload,
  query,
  req,
}: Args): Promise<T> => {
  let latestVersion: TypeWithVersion<T>

  if (config.versions?.drafts) {
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

  const doc = await payload.db.findOne<T>({ ...query, req })

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
