import type { SanitizedCollectionConfig, TypeWithID } from '../collections/config/types.js'
import type { FindOneArgs } from '../database/types.js'
import type { Payload, PayloadRequest, Where } from '../types/index.js'
import type { TypeWithVersion } from './types.js'

import { resolveBranchRowID } from '../branching/resolveBranchRowID.js'
import { combineQueries } from '../database/combineQueries.js'
import { hasDraftsEnabled } from '../utilities/getVersionsConfig.js'
import { appendVersionToQueryKey } from './drafts/appendVersionToQueryKey.js'

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
}: Args): Promise<T | undefined> => {
  let latestVersion!: TypeWithVersion<T>

  // Version rows on a branch hang off the shadow row, so `parent` is that row's
  // primary key rather than the canonical document ID the caller passed.
  const parentID = await resolveBranchRowID({ id, collectionSlug: config.slug, req })

  const whereQuery = published
    ? { and: [{ parent: { equals: parentID } }, { 'version._status': { equals: 'published' } }] }
    : { and: [{ parent: { equals: parentID } }, { latest: { equals: true } }] }

  if (hasDraftsEnabled(config)) {
    const { docs } = await payload.db.findVersions<T>({
      collection: config.slug,
      limit: 1,
      locale: req?.locale || query.locale,
      pagination: false,
      req,
      sort: '-updatedAt',
      where: combineQueries(appendVersionToQueryKey(query.where), whereQuery as unknown as Where),
    })
    latestVersion = docs[0]!
  }

  if (!latestVersion) {
    if (!published) {
      const doc = await payload.db.findOne<T>({ ...query, req })

      return doc ?? undefined
    }

    return undefined
  }

  latestVersion.version.id = id

  return latestVersion.version
}
