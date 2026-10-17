import type { Payload, PayloadRequest } from '../types/index.js'

import { afterRead } from '../fields/hooks/afterRead/index.js'
import { hasDraftsEnabled } from '../utilities/getVersionsConfig.js'
import { isolateBranchState, withoutBranch } from './resolveBranch.js'
import { resolveBranchRowID } from './resolveBranchRowID.js'
import { branchField } from './types.js'

type Args = {
  branch: string
  collectionSlug: string
  docID: number | string
  draft: boolean
  locale: string
  payload: Payload
  req: PayloadRequest
}

/** Reads the complete stored branch state without entity read hooks or configured projections. */
export const readLocalizedBranchWrite = async ({
  branch,
  collectionSlug,
  docID,
  draft,
  locale,
  payload,
  req,
}: Args): Promise<null | Record<string, unknown>> => {
  const branchReq = isolateBranchState(req)

  branchReq.branch = branch
  branchReq.locale = locale
  ;(branchReq.context as Record<string, unknown>)._branchBypass = false

  const collectionConfig = payload.collections[collectionSlug]!.config
  const where = { id: { equals: docID } }

  let storedDocument: null | Record<string, unknown> = null

  if (hasDraftsEnabled(collectionConfig)) {
    const branchRowID = await resolveBranchRowID({
      id: docID,
      branch,
      collectionSlug,
      req: branchReq,
    })
    const { docs } = await payload.db.findVersions({
      branch: false,
      collection: collectionSlug,
      limit: 1,
      locale,
      pagination: false,
      req: withoutBranch(branchReq),
      sort: '-updatedAt',
      where: {
        and: [
          { parent: { equals: branchRowID } },
          { [branchField]: { equals: branch } },
          draft ? { latest: { equals: true } } : { 'version._status': { equals: 'published' } },
        ],
      },
    })
    const storedVersion = docs[0] as { version?: Record<string, unknown> } | undefined

    storedDocument = storedVersion?.version ?? null
  }

  storedDocument ??= (await payload.db.findOne({
    branch,
    collection: collectionSlug,
    draftsEnabled: draft,
    locale,
    req: branchReq,
    where,
  })) as null | Record<string, unknown>

  if (!storedDocument) {
    return null
  }

  return afterRead({
    collection: collectionConfig,
    context: branchReq.context,
    depth: 0,
    doc: storedDocument,
    draft,
    fallbackLocale: null,
    global: null,
    locale,
    overrideAccess: true,
    req: branchReq,
    showHiddenFields: true,
    triggerAccessControl: false,
    triggerDefaultValue: false,
    triggerHooks: false,
    triggerPopulation: false,
  })
}
