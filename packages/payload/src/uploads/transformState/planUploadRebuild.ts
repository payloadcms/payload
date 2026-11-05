import type { Document, PayloadRequest } from '../../types/index.js'
import type { PlannedTransformerPipeline } from '../transformers/planTransformerPipeline.js'
import type { UploadTransformer } from '../transformers/types.js'

import { ValidationError } from '../../errors/ValidationError.js'
import { planTransformerPipeline } from '../transformers/planTransformerPipeline.js'
import { getUploadTransformerInternal } from '../transformers/uploadTransformerBridge.js'
import { getChangedTransformKeys } from './getChangedTransformKeys.js'
import { getTransformKeyCoverageErrors } from './getTransformKeyCoverageErrors.js'
import { isClaimRequired, isFocalPointKey } from './transformKeyClaims.js'

export type UploadPlan = { mimeType: string } & PlannedTransformerPipeline

type PlanArgs = {
  collectionSlug: string
  pipelineDoc: Document
  pipelineOriginalDoc: Readonly<Document>
  req: PayloadRequest
}

/**
 * Decides whether an upload without a new file rebuilds from the stored file. A rebuild is planned
 * with the stored MIME type, so a key that cannot be applied fails before the stored file is read.
 * When request-time stages apply the saved keys, an update writes no file, and only a copy reads
 * the stored original.
 */
export async function planUploadRebuild({
  canApplyAtRequest,
  documentID,
  hasCropOrResizeEdit,
  isDuplicating,
  isExternalSource,
  isLegacyReupload,
  previousTransforms,
  storedMimeType,
  ...planArgs
}: {
  /** False when no original would be stored for request-time stages to start from. */
  canApplyAtRequest: boolean
  documentID?: number | string
  /** A crop or resize sent in the `uploadEdits` query. */
  hasCropOrResizeEdit: boolean
  isDuplicating: boolean
  isExternalSource: boolean
  /** The focal point and crop triggers that existed before claims. */
  isLegacyReupload: boolean
  /** The stored `_transforms` on an update; `undefined` when there is nothing to compare. */
  previousTransforms: Document['_transforms'] | undefined
  storedMimeType: string | undefined
} & PlanArgs): Promise<{
  /** The saved keys are applied when the file is requested, so no default file is stored. */
  isAppliedAtRequest: boolean
  rebuildPlan?: UploadPlan
  shouldRebuild: boolean
}> {
  if (isExternalSource) {
    return { isAppliedAtRequest: false, shouldRebuild: true }
  }

  const changedKeys =
    previousTransforms === undefined
      ? []
      : getChangedTransformKeys({
          next: planArgs.pipelineDoc._transforms,
          previous: previousTransforms,
        })
  const hasNonFocalPointChange = changedKeys.some((key) => !isFocalPointKey(key))

  if (!isDuplicating && !hasNonFocalPointChange && !isLegacyReupload) {
    return { isAppliedAtRequest: false, shouldRebuild: false }
  }

  if (!storedMimeType) {
    return { isAppliedAtRequest: false, shouldRebuild: true }
  }

  const rebuildPlan = await planUploadPipeline({ ...planArgs, mimeType: storedMimeType })
  const hasRequiredChange =
    isDuplicating || hasCropOrResizeEdit || changedKeys.some(isClaimRequired)
  // These keys rebuild the file only when a stage that runs claims them.
  const optionalChangedKeys = changedKeys.filter((key) => !isClaimRequired(key))
  if (isLegacyReupload) {
    optionalChangedKeys.push('focalPoint')
  }
  const shouldRebuild =
    hasRequiredChange ||
    getStagesThatRun({
      collectionSlug: planArgs.collectionSlug,
      plan: rebuildPlan,
    }).stagesThatRun.some((transformer) =>
      rebuildPlan.claims.get(transformer)?.some((key) => optionalChangedKeys.includes(key)),
    )

  if (!shouldRebuild) {
    return { isAppliedAtRequest: false, rebuildPlan, shouldRebuild }
  }

  const { isAppliedAtRequest } = await resolveTransformKeyCoverage({
    ...planArgs,
    canApplyAtRequest,
    documentID,
    mimeType: storedMimeType,
    plan: rebuildPlan,
  })

  return { isAppliedAtRequest, rebuildPlan, shouldRebuild: !isAppliedAtRequest || isDuplicating }
}

/** Plans the upload pipeline for one MIME type, without checking claims. */
export async function planUploadPipeline({
  collectionSlug,
  mimeType,
  pipelineOriginalDoc,
  req,
}: { mimeType: string } & PlanArgs): Promise<UploadPlan> {
  const plan = await planTransformerPipeline({
    args: {
      collectionSlug,
      doc: pipelineOriginalDoc,
      mimeType,
      operation: 'upload',
      originalDoc: pipelineOriginalDoc,
      req,
    },
    capability: 'transformFile',
    transformers: req.payload.config.upload?.transformers ?? [],
  })

  return { ...plan, mimeType }
}

/**
 * The planned stages that run. Only one Sharp bridge drives an upload: the one that owns the
 * collection, or the first. The other bridges do not run, so they do not count as claimers.
 */
export function getStagesThatRun({
  collectionSlug,
  plan,
}: {
  collectionSlug: string
  plan: PlannedTransformerPipeline
}): {
  bridgeTransformer?: UploadTransformer
  /** The claims of the stages that run. */
  claimsOfStagesThatRun: Map<UploadTransformer, string[]>
  stagesThatRun: UploadTransformer[]
} {
  const bridgeTransformers = plan.pipeline.filter((transformer) =>
    Boolean(getUploadTransformerInternal(transformer)?.prepareUpload),
  )
  const bridgeTransformer =
    bridgeTransformers.find((transformer) =>
      getUploadTransformerInternal(transformer)!.handlesCollection?.({ collectionSlug }),
    ) ?? bridgeTransformers[0]

  const stagesThatRun = plan.pipeline.filter(
    (transformer) => transformer === bridgeTransformer || !bridgeTransformers.includes(transformer),
  )

  return {
    bridgeTransformer,
    claimsOfStagesThatRun: new Map(
      [...plan.claims].filter(([transformer]) => stagesThatRun.includes(transformer)),
    ),
    stagesThatRun,
  }
}

/**
 * Decides where the saved keys are applied. Upload stages that run apply them into a stored file.
 * When those leave a key with no claim, request-time stages can apply every saved key instead: the
 * default file is then built when it is requested, and only the original is stored. When both kinds
 * claim a key, the upload stage wins. Fails before any file work when neither covers the keys.
 */
export async function resolveTransformKeyCoverage({
  canApplyAtRequest,
  collectionSlug,
  documentID,
  mimeType,
  pipelineDoc,
  pipelineOriginalDoc,
  plan,
  req,
}: {
  /** False when no original would be stored for request-time stages to start from. */
  canApplyAtRequest: boolean
  documentID?: number | string
  mimeType: string
  plan: PlannedTransformerPipeline
} & PlanArgs): Promise<{ isAppliedAtRequest: boolean }> {
  const { claimsOfStagesThatRun } = getStagesThatRun({ collectionSlug, plan })
  const errors = getTransformKeyCoverageErrors({
    claims: claimsOfStagesThatRun,
    transforms: pipelineDoc._transforms,
  })

  if (errors.length === 0) {
    return { isAppliedAtRequest: false }
  }

  const uploadClaimedKeys = new Set([...claimsOfStagesThatRun.values()].flat())
  const hasOnlyUnclaimedKeys = errors.every(
    ({ path }) => !uploadClaimedKeys.has(path.slice('_transforms.'.length)),
  )

  if (canApplyAtRequest && hasOnlyUnclaimedKeys) {
    const requestPlan = await planTransformerPipeline({
      args: {
        collectionSlug,
        doc: pipelineOriginalDoc,
        documentID,
        mimeType,
        operation: 'request',
        originalDoc: pipelineOriginalDoc,
        purpose: 'persisted-default',
        req,
      },
      capability: 'handleRequest',
      transformers: req.payload.config.upload?.transformers ?? [],
    })

    if (
      getTransformKeyCoverageErrors({
        claims: requestPlan.claims,
        transforms: pipelineDoc._transforms,
      }).length === 0
    ) {
      return { isAppliedAtRequest: true }
    }
  }

  throw new ValidationError({ collection: collectionSlug, errors, req }, req.t)
}

/** Fails before any file work when a saved key has no claiming stage, or more than one. */
export function assertTransformKeysCovered({
  collectionSlug,
  pipelineDoc,
  plan,
  req,
}: {
  plan: PlannedTransformerPipeline
} & Pick<PlanArgs, 'collectionSlug' | 'pipelineDoc' | 'req'>): void {
  const { claimsOfStagesThatRun } = getStagesThatRun({ collectionSlug, plan })
  const errors = getTransformKeyCoverageErrors({
    claims: claimsOfStagesThatRun,
    transforms: pipelineDoc._transforms,
  })

  if (errors.length > 0) {
    throw new ValidationError({ collection: collectionSlug, errors, req }, req.t)
  }
}
