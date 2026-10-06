import type { SanitizedCollectionConfig, TypeWithID } from '../collections/config/types.js'
import type { FindOneArgs } from '../database/types.js'
import type { Payload, PayloadRequest, Where } from '../types/index.js'
import type { DocumentVersion } from '../types/operations.js'
import type { TypeWithVersion } from './types.js'

import { combineQueries } from '../database/combineQueries.js'
import { hasDraftsEnabled } from '../utilities/getVersionsConfig.js'
import { appendVersionToQueryKey } from './drafts/appendVersionToQueryKey.js'
import { getVersionStatusQuery } from './getVersionStatusQuery.js'
import { resolveVersionDocument } from './resolveVersionDocument.js'

type Args = {
  config: SanitizedCollectionConfig
  id: number | string
  payload: Payload
  published?: boolean
  query: FindOneArgs
  req?: PayloadRequest
  version?: DocumentVersion
}

export const getLatestCollectionVersion = async <T extends TypeWithID = any>({
  id,
  config,
  payload,
  published,
  query,
  req,
  version,
}: Args): Promise<T | undefined> => {
  let latestVersion!: TypeWithVersion<T>

  const shouldReadPublished = published || version === 'published'

  if (shouldReadPublished) {
    const where = hasDraftsEnabled(config)
      ? combineQueries(
          query.where || {},
          getVersionStatusQuery({
            entity: config,
            locale: req?.locale || query.locale,
            localization: payload.config.localization,
            status: 'published',
          }),
        )
      : query.where

    return (await payload.db.findOne<T>({ ...query, req, where })) ?? undefined
  }

  const whereQuery: Where = {
    and: [
      { parent: { equals: id } },
      { latest: { equals: true } },
      appendVersionToQueryKey(
        getVersionStatusQuery({
          entity: config,
          locale: version === 'draft' ? 'all' : req?.locale || query.locale,
          localization: payload.config.localization,
          status: 'draft',
        }),
      ),
    ],
  }

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
    if (hasDraftsEnabled(config)) {
      const activeDraft = await payload.db.findVersions({
        collection: config.slug,
        limit: 1,
        pagination: false,
        req,
        where: whereQuery,
      })

      // A denied active draft cannot be replaced with an accessible published copy.
      if (activeDraft.docs.length > 0) {
        return undefined
      }
    }

    if (!published) {
      const doc = await payload.db.findOne<T>({ ...query, req })

      return doc ?? undefined
    }

    return undefined
  }

  latestVersion.version.id = id

  return req && version !== 'draft'
    ? resolveVersionDocument({
        doc: latestVersion.version,
        entity: config,
        publishedDoc: await payload.db.findOne<T>({ ...query, locale: 'all', req }),
        req,
        version: 'latest',
      })
    : latestVersion.version
}
