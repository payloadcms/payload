import type { SanitizedCollectionConfig, TypeWithID } from '../collections/config/types.js'
import type { FindOneArgs } from '../database/types.js'
import type { Payload, PayloadRequest, Where } from '../types/index.js'
import type { BranchWriteObservation } from './branches/writes/prepareBranchWrite.js'
import type { TypeWithVersion } from './types.js'

import { combineQueries } from '../database/combineQueries.js'
import { hasDraftsEnabled } from '../utilities/getVersionsConfig.js'
import { resolveBranchOriginal } from './branches/operations/resolveBranchOriginal.js'
import { legacyVersionWhere } from './branches/storage/legacyVersionWhere.js'
import { appendVersionToQueryKey } from './drafts/appendVersionToQueryKey.js'

type Args = {
  branchWrite?: BranchWriteObservation | null
  config: SanitizedCollectionConfig
  id: number | string
  overrideAccess?: boolean
  payload: Payload
  published?: boolean
  query: FindOneArgs
  req?: PayloadRequest
}

export const getLatestCollectionVersion = async <T extends TypeWithID = any>({
  id,
  branchWrite,
  config,
  overrideAccess,
  payload,
  published,
  query,
  req,
}: Args): Promise<T | undefined> => {
  if (branchWrite) {
    return (await resolveBranchOriginal({
      collection: config.slug,
      observation: branchWrite,
      overrideAccess,
      req: req!,
      where: query.where,
    })) as T | undefined
  }

  let latestVersion!: TypeWithVersion<T>

  const whereQuery = published
    ? { and: [{ parent: { equals: id } }, { 'version._status': { equals: 'published' } }] }
    : { and: [{ parent: { equals: id } }, { latest: { equals: true } }] }

  if (hasDraftsEnabled(config)) {
    const { docs } = await payload.db.findVersions<T>({
      collection: config.slug,
      limit: 1,
      locale: req?.locale || query.locale,
      pagination: false,
      req,
      sort: '-updatedAt',
      where: legacyVersionWhere({
        entity: config,
        where: combineQueries(appendVersionToQueryKey(query.where), whereQuery as unknown as Where),
      }),
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
