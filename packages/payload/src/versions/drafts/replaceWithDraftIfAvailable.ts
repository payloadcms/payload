// @ts-strict-ignore
import type { SanitizedCollectionConfig, TypeWithID } from '../../collections/config/types.js'
import type { AccessResult } from '../../config/types.js'
import type { FindGlobalVersionsArgs, FindVersionsArgs } from '../../database/types.js'
import type { SanitizedGlobalConfig } from '../../globals/config/types.js'
import type { PayloadRequest, SelectType, Where } from '../../types/index.js'

import { hasWhereAccessResult } from '../../auth/index.js'
import { combineQueries } from '../../database/combineQueries.js'
import { docHasTimestamps } from '../../types/index.js'
import sanitizeInternalFields from '../../utilities/sanitizeInternalFields.js'
import { appendVersionToQueryKey } from './appendVersionToQueryKey.js'
import { getQueryDraftsSelect } from './getQueryDraftsSelect.js'

type Arguments<T> = {
  accessResult: AccessResult
  doc: T
  entity: SanitizedCollectionConfig | SanitizedGlobalConfig
  entityType: 'collection' | 'global'
  overrideAccess: boolean
  req: PayloadRequest
  select?: SelectType
}

const replaceWithDraftIfAvailable = async <T extends TypeWithID>({
  accessResult,
  doc,
  entity,
  entityType,
  req,
  select,
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
    select: getQueryDraftsSelect({ select }),
    sort: '-updatedAt',
    where: combineQueries(queryToBuild, versionAccessResult),
  }

  let versionDocs
  if (entityType === 'global') {
    versionDocs = (await req.payload.db.findGlobalVersions<T>(findVersionsArgs)).docs
  } else {
    versionDocs = (await req.payload.db.findVersions<T>(findVersionsArgs)).docs
  }

  let draft = versionDocs[0]

  if (!draft) {
    return doc
  }

  draft = sanitizeInternalFields(draft)

  // Patch globalType onto version doc
  if (entityType === 'global' && 'globalType' in doc) {
    draft.version.globalType = doc.globalType
  }

  // handle when .version wasn't selected due to projection
  if (!draft.version) {
    draft.version = {}
  }

  // Disregard all other draft content at this point,
  // Only interested in the version itself.
  // Operations will handle firing hooks, etc.

  draft.version.id = doc.id

  return draft.version
}

export default replaceWithDraftIfAvailable
