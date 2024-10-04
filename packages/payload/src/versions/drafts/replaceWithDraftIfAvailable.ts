import type { SanitizedCollectionConfig, TypeWithID } from '../../collections/config/types.js'
import type { AccessResult } from '../../config/types.js'
import type { FindGlobalVersionsArgs, FindVersionsArgs } from '../../database/types.js'
import type { SanitizedGlobalConfig } from '../../globals/config/types.js'
import type { PayloadRequest, Where } from '../../types/index.js'

import { hasWhereAccessResult } from '../../auth/index.js'
import { combineQueries } from '../../database/combineQueries.js'
import { docHasTimestamps } from '../../types/index.js'
import { deepCopyObjectSimple } from '../../utilities/deepCopyObject.js'
import sanitizeInternalFields from '../../utilities/sanitizeInternalFields.js'
import { appendVersionToQueryKey } from './appendVersionToQueryKey.js'

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
      or: [
        {
          updatedAt: {
            greater_than: doc.updatedAt,
          },
        },
        {
          latest: {
            equals: true,
          },
        },
      ],
    })
  }

  let versionAccessResult

  if (hasWhereAccessResult(accessResult)) {
    versionAccessResult = appendVersionToQueryKey(accessResult)
  }

  const findVersionsArgs: FindGlobalVersionsArgs & FindVersionsArgs = {
    collection: entity.slug,
    global: entity.slug,
    limit: 1,
    locale,
    pagination: false,
    req,
    sort: '-updatedAt',
    where: combineQueries(queryToBuild, versionAccessResult),
  }

  let versionDocs
  if (entityType === 'global') {
    const collectionConfig = req.payload.config.collections[entity.slug]
    if (collectionConfig?.db?.findGlobalVersions) {
      versionDocs = (await collectionConfig.db.findGlobalVersions<T>(findVersionsArgs)).docs
    } else {
      versionDocs = (await req.payload.db.findGlobalVersions<T>(findVersionsArgs)).docs
    }
  } else {
    const globalConfig = req.payload.config.globals[entity.slug]
    if (globalConfig?.db?.findVersions) {
      versionDocs = (await globalConfig.db.findVersions<T>(findVersionsArgs)).docs
    } else {
      versionDocs = (await req.payload.db.findVersions<T>(findVersionsArgs)).docs
    }
  }

  let draft = versionDocs[0]

  if (!draft) {
    return doc
  }

  draft = deepCopyObjectSimple(draft)
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
