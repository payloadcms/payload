import type { SanitizedCollectionConfig, TypeWithID } from '../../collections/config/types'
import type { AccessResult } from '../../config/types'
import type { FindGlobalVersionsArgs, FindVersionsArgs } from '../../database/types'
import type { SanitizedGlobalConfig } from '../../globals/config/types'
import type { PayloadRequest, Where } from '../../types'

import { hasWhereAccessResult } from '../../auth'
import { combineQueries } from '../../database/combineQueries'
import { docHasTimestamps } from '../../types'
import sanitizeInternalFields from '../../utilities/sanitizeInternalFields'
import { appendVersionToQueryKey } from './appendVersionToQueryKey'

type Arguments<T> = {
  accessResult: AccessResult
  doc: T
  entity: SanitizedCollectionConfig | SanitizedGlobalConfig
  entityType: 'collection' | 'global'
  overrideAccess: boolean
  req: PayloadRequest
}

const replaceWithDraftIfAvailable = async <T extends TypeWithID>({
  accessResult,
  doc,
  entity,
  entityType,
  req,
}: Arguments<T>): Promise<T> => {
  const { locale } = req

  const queryToBuild: Where = {
    and: [
      {
        'version._status': {
          equals: 'draft',
        },
      },
    ],
  }

  if (entityType === 'collection') {
    queryToBuild.and.push({
      parent: {
        equals: doc.id,
      },
    })
  }

  if (docHasTimestamps(doc)) {
    queryToBuild.and.push({
      updatedAt: {
        greater_than: doc.updatedAt,
      },
    })
  }

  let versionAccessResult

  if (hasWhereAccessResult(accessResult)) {
    versionAccessResult = appendVersionToQueryKey(accessResult)
  }

  const findVersionsArgs: FindVersionsArgs & FindGlobalVersionsArgs = {
    collection: entity.slug,
    global: entity.slug,
    limit: 1,
    locale,
    req,
    sort: '-updatedAt',
    where: combineQueries(queryToBuild, versionAccessResult),
  }

  let versionDocs
  if (entityType === 'global') {
    if (entity?.db?.findGlobalVersions) {
      versionDocs = (await entity.db.findGlobalVersions<T>(findVersionsArgs)).docs
    } else {
      versionDocs = (await req.payload.db.findGlobalVersions<T>(findVersionsArgs)).docs
    }
  } else {
    if (entity?.db?.findVersions) {
      versionDocs = (await entity.db.findVersions<T>(findVersionsArgs)).docs
    } else {
      versionDocs = (await req.payload.db.findVersions<T>(findVersionsArgs)).docs
    }
  }

  let draft = versionDocs[0]

  if (!draft) {
    return doc
  }

  draft = JSON.parse(JSON.stringify(draft))
  draft = sanitizeInternalFields(draft)

  // Patch globalType onto version doc
  if (entityType === 'global' && 'globalType' in doc) {
    draft.version.globalType = doc.globalType
  }

  // Disregard all other draft content at this point,
  // Only interested in the version itself.
  // Operations will handle firing hooks, etc.
  return {
    id: doc.id,
    ...draft.version,
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
  }
}

export default replaceWithDraftIfAvailable
