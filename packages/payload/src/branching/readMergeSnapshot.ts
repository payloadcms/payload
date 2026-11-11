import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../globals/config/types.js'
import type { JsonObject, Payload, PayloadRequest } from '../types/index.js'

import { executeAccess } from '../auth/executeAccess.js'
import { combineQueries } from '../database/combineQueries.js'
import { afterRead } from '../fields/hooks/afterRead/index.js'
import { branchField, MAIN_BRANCH } from './types.js'

type ReadCollectionMergeSnapshotArgs = {
  collectionSlug: string
  docID: number | string
  payload: Payload
  req: PayloadRequest
}

type ReadGlobalMergeSnapshotArgs = {
  globalSlug: string
  payload: Payload
  req: PayloadRequest
}

/** Reads a main document for the merge ledger without invoking user read hooks or population. */
export const readCollectionMergeSnapshot = async ({
  collectionSlug,
  docID,
  payload,
  req,
}: ReadCollectionMergeSnapshotArgs): Promise<null | Record<string, unknown>> => {
  const collectionConfig = payload.collections[collectionSlug]!.config
  const accessResult = await executeAccess(
    { id: docID, slug: collectionSlug, disableErrors: true, req },
    collectionConfig.access.read,
  )

  if (!accessResult) {
    return null
  }

  const storedDocument = (await payload.db.findOne({
    branch: false,
    collection: collectionSlug,
    draftsEnabled: false,
    locale: req.locale!,
    req,
    where: combineQueries(
      {
        and: [{ [branchField]: { equals: MAIN_BRANCH } }, { id: { equals: docID } }],
      },
      accessResult,
    ),
  })) as null | Record<string, unknown>

  if (!storedDocument) {
    return null
  }

  return sanitizeMergeSnapshot({
    collection: collectionConfig,
    doc: storedDocument,
    global: null,
    req,
  })
}

/** Reads a main global for the merge ledger without invoking user read hooks or population. */
export const readGlobalMergeSnapshot = async ({
  globalSlug,
  payload,
  req,
}: ReadGlobalMergeSnapshotArgs): Promise<null | Record<string, unknown>> => {
  const globalConfig = payload.globals?.config.find((config) => config.slug === globalSlug)

  if (!globalConfig) {
    return null
  }

  const accessResult = await executeAccess(
    { slug: globalSlug, disableErrors: true, req },
    globalConfig.access.read,
  )

  if (!accessResult) {
    return null
  }

  const storedGlobal = (await payload.db.findGlobal({
    slug: globalSlug,
    branch: false,
    locale: req.locale!,
    req,
    where: combineQueries({ [branchField]: { equals: MAIN_BRANCH } }, accessResult),
  })) as null | Record<string, unknown>

  if (!storedGlobal || Object.keys(storedGlobal).length === 0) {
    return null
  }

  return sanitizeMergeSnapshot({
    collection: null,
    doc: storedGlobal,
    global: globalConfig,
    req,
  })
}

const sanitizeMergeSnapshot = async ({
  collection,
  doc,
  global,
  req,
}: {
  collection: null | SanitizedCollectionConfig
  doc: Record<string, unknown>
  global: null | SanitizedGlobalConfig
  req: PayloadRequest
}): Promise<Record<string, unknown>> =>
  afterRead({
    collection,
    context: req.context,
    depth: 0,
    doc: doc as JsonObject,
    draft: false,
    fallbackLocale: req.fallbackLocale!,
    global,
    locale: req.locale!,
    overrideAccess: false,
    req,
    showHiddenFields: false,
    triggerAccessControl: true,
    triggerDefaultValue: false,
    triggerHooks: false,
    triggerPopulation: false,
  })
