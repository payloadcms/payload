import type { SanitizedCollectionConfig, TypeWithID } from '../../collections/config/types.js'
import type { AccessResult } from '../../config/types.js'
import type { FindGlobalVersionsArgs, FindVersionsArgs } from '../../database/types.js'
import type { SanitizedGlobalConfig } from '../../globals/config/types.js'
import type { PayloadRequest, SelectType, Where } from '../../types/index.js'

import { hasWhereAccessResult } from '../../auth/index.js'
import { combineQueries } from '../../database/combineQueries.js'
import { docHasTimestamps } from '../../types/index.js'
import { sanitizeInternalFields } from '../../utilities/sanitizeInternalFields.js'
import { appendVersionToQueryKey } from '../drafts/appendVersionToQueryKey.js'
import { getQueryDraftsSelect } from '../drafts/getQueryDraftsSelect.js'
import { getDraftStatusWhere } from './getDraftStatusWhere.js'

export type ReplaceWithVersionPolicy = 'draft' | 'latest'

type Arguments<T> = {
  accessResult: AccessResult
  doc: T
  entity: SanitizedCollectionConfig | SanitizedGlobalConfig
  entityType: 'collection' | 'global'
  fallbackDoc?: null | T
  overrideAccess: boolean
  policy: ReplaceWithVersionPolicy
  req: PayloadRequest
  select?: SelectType
  where?: Where
}

/**
 * Chooses between a found draft version and the published document.
 * `latest` falls back to published content. `draft` returns no result when no draft exists.
 */
export function applyReplacePolicy<T>({
  draftVersion,
  fallbackDoc,
  fallbackIsDraft = false,
  policy,
}: {
  draftVersion: T | undefined
  fallbackDoc: null | T
  fallbackIsDraft?: boolean
  policy: ReplaceWithVersionPolicy
}): null | T {
  if (draftVersion) {
    return draftVersion
  }

  if (fallbackDoc && (policy === 'latest' || fallbackIsDraft)) {
    return fallbackDoc
  }

  return null
}

/**
 * Replaces a published document with its newest draft when one exists.
 *
 * - `latest`: newest saved draft, otherwise the published document
 * - `draft`: newest draft only, with no published fallback
 */
export const replaceWithVersion = async <T extends TypeWithID>({
  accessResult,
  doc,
  entity,
  entityType,
  fallbackDoc: fallbackDocArg,
  policy,
  req,
  select,
  where,
}: Arguments<T>): Promise<null | T> => {
  const { locale, payload } = req
  const fallbackDoc = fallbackDocArg === undefined ? doc : fallbackDocArg

  const queryToBuild: Where = {
    and: [getDraftStatusWhere({ entity, locale: locale ?? undefined, payload })],
  }

  if (entityType === 'collection') {
    queryToBuild.and!.push({
      parent: {
        equals: doc.id,
      },
    })
  }

  if (docHasTimestamps(doc)) {
    queryToBuild.and!.push({
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

  let versionAccessResult: undefined | Where

  if (hasWhereAccessResult(accessResult)) {
    versionAccessResult = appendVersionToQueryKey(accessResult)
  }

  let versionWhere = combineQueries(queryToBuild, versionAccessResult!)

  if (where) {
    versionWhere = combineQueries(versionWhere, appendVersionToQueryKey(where))
  }

  const findVersionsArgs: FindGlobalVersionsArgs & FindVersionsArgs = {
    collection: entity.slug,
    global: entity.slug,
    limit: 1,
    locale: locale!,
    pagination: false,
    req,
    select: getQueryDraftsSelect({ select }),
    sort: '-updatedAt',
    where: versionWhere,
  }

  let versionDocs
  if (entityType === 'global') {
    versionDocs = (await req.payload.db.findGlobalVersions<T>(findVersionsArgs)).docs
  } else {
    versionDocs = (await req.payload.db.findVersions<T>(findVersionsArgs)).docs
  }

  let draft = versionDocs[0]

  if (!draft) {
    const fallbackStatus = (fallbackDoc as null | Record<string, unknown>)?._status
    const fallbackIsDraft =
      fallbackStatus === 'draft' ||
      (fallbackStatus !== null &&
        typeof fallbackStatus === 'object' &&
        (locale === 'all' || locale === '*' || !locale
          ? Object.values(fallbackStatus).some((status) => status === 'draft')
          : (fallbackStatus as Record<string, unknown>)[locale] === 'draft'))

    return applyReplacePolicy({
      draftVersion: undefined,
      fallbackDoc,
      fallbackIsDraft,
      policy,
    })
  }

  draft = sanitizeInternalFields(draft)

  if (entityType === 'global' && 'globalType' in doc) {
    // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
    draft.version.globalType = doc.globalType
  }

  if (!draft.version) {
    draft.version = {} as T
  }

  draft.version.id = doc.id

  return applyReplacePolicy({
    draftVersion: draft.version,
    fallbackDoc,
    policy,
  })
}
