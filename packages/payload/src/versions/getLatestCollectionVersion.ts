import type { SanitizedCollectionConfig, TypeWithID } from '../collections/config/types.js'
import type { FindOneArgs } from '../database/types.js'
import type { Payload, PayloadRequest } from '../types/index.js'
import type { TypeWithVersion } from './types.js'

import { combineQueries } from '../database/combineQueries.js'
import { appendVersionToQueryKey } from './drafts/appendVersionToQueryKey.js'

type Args = {
  config: SanitizedCollectionConfig
  id: number | string
  payload: Payload
  published?: boolean
  query: FindOneArgs
  req?: PayloadRequest
}

/**
 * Returns document with localized fields
 *
 * - If versions are enabled: from the versions collection
 * - If versions are disabled: from the main collection
 */
export const getLatestCollectionVersion = async <T extends TypeWithID = any>({
  id,
  config,
  payload,
  published,
  query,
  req,
}: Args): Promise<T> => {
  let latestVersion!: TypeWithVersion<T>

  if (config.versions?.drafts) {
    const { docs } = await payload.db.findVersions<T>({
      collection: config.slug,
      limit: 1,
      pagination: false,
      req,
      sort: '-updatedAt',
      where: combineQueries(
        appendVersionToQueryKey(query.where),
        published
          ? { and: [{ parent: { equals: id } }, { 'version._status': { equals: 'published' } }] }
          : { and: [{ parent: { equals: id } }, { latest: { equals: true } }] },
      ),
    })
    latestVersion = docs[0]!
  }

  if (!latestVersion) {
    if (!published) {
      const doc = await payload.db.findOne<T>({ ...query, req })

      return doc!
    }

    return undefined!
  }

  latestVersion.version.id = id

  return latestVersion.version
}
