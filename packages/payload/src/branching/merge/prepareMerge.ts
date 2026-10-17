import type { Payload, PayloadRequest } from '../../types/index.js'
import type { MergeResult } from '../merge.js'
import type { BranchOperation, MergeableChange, MergeWarning } from '../types.js'
import type { BranchMergeValidationError } from '../validation.js'

import { createPayloadRequest } from '../../utilities/createPayloadRequest.js'
import { assertBranchActionAccess } from '../assertBranchActionAccess.js'
import { resolveEffectiveOperations } from '../effectiveOperations.js'
import {
  runGlobalMergePreflight,
  runMergeDependencyPreflight,
  runMergePreflight,
} from '../preflight.js'
import { withoutBranch } from '../resolveBranch.js'
import { selectBranchChanges } from '../selectBranchChanges.js'
import {
  branchChangesCollectionSlug,
  branchesCollectionSlug,
  branchField,
  MAIN_BRANCH,
} from '../types.js'
import {
  createBranchMergeValidationRequest,
  createMainBranchRequest,
  prepareBranchMergeValidationCandidates,
} from '../validation.js'
import { inspectFailedCleanups } from './retryFailedCleanups.js'
import { changeDocID } from './utilities.js'

export type PreparedBranchChange = {
  doc?: unknown
  id: number | string
} & Record<string, unknown>

export type PreparedMerge = {
  applicable: PreparedBranchChange[]
  applicableGlobals: PreparedBranchChange[]
  branchDoc: { id: number | string }
  mergeable: MergeableChange[]
  req: PayloadRequest
  result: MergeResult
  retryableCleanups: MergeableChange[]
}

export const prepareMerge = async ({
  branch,
  dryRun,
  incomingReq,
  overrideAccess,
  payload,
  selected,
  user,
}: {
  branch: string
  dryRun: boolean
  incomingReq?: PayloadRequest
  overrideAccess: boolean
  payload: Payload
  selected?: (number | string)[]
  user?: NonNullable<PayloadRequest['user']>
}): Promise<PreparedMerge> => {
  const req = incomingReq
    ? withoutBranch(incomingReq)
    : await createPayloadRequest({ branch: false, payload, user })

  if (user && !req.user) {
    req.user = user
  }

  const branchDocs = await payload.find({
    collection: branchesCollectionSlug,
    limit: 1,
    overrideAccess,
    pagination: false,
    req,
    where: { slug: { equals: branch } },
  })
  const branchDoc = branchDocs.docs[0]

  if (!branchDoc) {
    throw new Error(`Branch "${branch}" was not found.`)
  }

  if (!overrideAccess) {
    await assertBranchActionAccess({ action: 'mergeBranch', branchDoc, req })
  }

  const cleanupRetry = dryRun
    ? { handledChangeIDs: new Set<string>(), retryable: [] }
    : await inspectFailedCleanups({ branch, payload, req, selected })
  const retryableCleanups = cleanupRetry.retryable
  const allChanges = await payload.find({
    collection: branchChangesCollectionSlug,
    overrideAccess: true,
    pagination: false,
    req,
    sort: 'createdAt',
    where: { branch: { equals: branch } },
  })
  const selectedChanges = selectBranchChanges({
    changes: allChanges.docs,
    excluded: cleanupRetry.handledChangeIDs,
    selected,
  })
  const pending = selectedChanges.filter(
    (change) => change.entityType !== 'global',
  ) as PreparedBranchChange[]
  const pendingGlobals = selectedChanges.filter(
    (change) => change.entityType === 'global',
  ) as PreparedBranchChange[]
  const resolved = await resolveEffectiveOperations({ branch, changes: pending, payload, req })
  const targetReq = createMainBranchRequest({ req })
  const blocked = overrideAccess
    ? []
    : await runMergePreflight({ payload, pending: resolved, req: targetReq })
  const blockedGlobals = overrideAccess
    ? []
    : await runGlobalMergePreflight({ payload, pending: pendingGlobals, req: targetReq })

  blocked.push(...blockedGlobals)
  blocked.push(
    ...(await runMergeDependencyPreflight({
      initiallyBlocked: blocked,
      payload,
      pending: resolved,
      pendingGlobals,
      req: targetReq,
    })),
  )

  const validationCandidates = await prepareBranchMergeValidationCandidates({
    payload,
    pending: resolved,
    pendingGlobals,
    req: targetReq,
  })
  const validation = await payload.config.branching.validate({
    branch,
    candidates: validationCandidates,
    req: createBranchMergeValidationRequest({ req: targetReq }),
    target: MAIN_BRANCH,
  })
  const hasPreflightErrors = blocked.length > 0 || !validation.valid
  const applicable = hasPreflightErrors ? [] : pending
  const applicableGlobals = hasPreflightErrors ? [] : pendingGlobals
  const mergeable: MergeableChange[] = [
    ...retryableCleanups,
    ...applicable.map((change) => ({
      changeID: change.id,
      collectionSlug: change.collectionSlug as string,
      docID: changeDocID(change),
      entityType: 'collection' as const,
      operation: change.operation as BranchOperation,
    })),
  ]

  mergeable.push(
    ...applicableGlobals.map((change) => ({
      changeID: change.id,
      entityType: 'global' as const,
      globalSlug: change.globalSlug as string,
      operation: 'update' as const,
    })),
  )

  const warnings: MergeWarning[] = []

  for (const change of applicable) {
    if (change.operation === 'create' || !change.baseUpdatedAt) {
      continue
    }

    const collectionSlug = change.collectionSlug as string
    const docID = changeDocID(change)
    const mainDoc = (await payload.db.findOne({
      branch: false,
      collection: collectionSlug,
      req,
      where: {
        and: [{ [branchField]: { equals: MAIN_BRANCH } }, { id: { equals: docID } }],
      },
    })) as null | Record<string, unknown>

    if (
      mainDoc?.updatedAt &&
      new Date(mainDoc.updatedAt as string) > new Date(change.baseUpdatedAt as string)
    ) {
      warnings.push({
        changeID: change.id,
        collectionSlug,
        docID,
        message: `"${collectionSlug}" document ${docID} changed on main after it was branched. Merging will overwrite that change.`,
        reason: 'main-moved',
      })
    }
  }

  return {
    applicable,
    applicableGlobals,
    branchDoc,
    mergeable,
    req,
    result: {
      blocked,
      canMerge: mergeable.length > 0,
      mergeable,
      merged: [],
      validationErrors: validation.errors,
      warnings,
    },
    retryableCleanups,
  }
}

export const revalidatePreparedMerge = async ({
  applicable,
  applicableGlobals,
  branch,
  overrideAccess,
  payload,
  req,
}: {
  applicable: PreparedBranchChange[]
  applicableGlobals: PreparedBranchChange[]
  branch: string
  overrideAccess: boolean
  payload: Payload
  req: PayloadRequest
}): Promise<{
  blocked: MergeResult['blocked']
  isValid: boolean
  validationErrors: BranchMergeValidationError[]
}> => {
  const refreshedResolved = await resolveEffectiveOperations({
    branch,
    changes: applicable,
    payload,
    req,
  })
  const targetReq = createMainBranchRequest({ req })
  const blocked = overrideAccess
    ? []
    : await runMergePreflight({ payload, pending: refreshedResolved, req: targetReq })
  const blockedGlobals = overrideAccess
    ? []
    : await runGlobalMergePreflight({
        payload,
        pending: applicableGlobals,
        req: targetReq,
      })

  blocked.push(...blockedGlobals)
  blocked.push(
    ...(await runMergeDependencyPreflight({
      initiallyBlocked: blocked,
      payload,
      pending: refreshedResolved,
      pendingGlobals: applicableGlobals,
      req: targetReq,
    })),
  )

  const validationCandidates = await prepareBranchMergeValidationCandidates({
    payload,
    pending: refreshedResolved,
    pendingGlobals: applicableGlobals,
    req: targetReq,
  })
  const validation = await payload.config.branching.validate({
    branch,
    candidates: validationCandidates,
    req: createBranchMergeValidationRequest({ req: targetReq }),
    target: MAIN_BRANCH,
  })

  return {
    blocked,
    isValid: blocked.length === 0 && validation.valid,
    validationErrors: validation.errors,
  }
}
