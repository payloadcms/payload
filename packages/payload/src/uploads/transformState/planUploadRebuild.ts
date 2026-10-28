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
 */
export async function planUploadRebuild({
  hasCropOrResizeEdit,
  isDuplicating,
  isExternalSource,
  isLegacyReupload,
  previousTransforms,
  storedMimeType,
  ...planArgs
}: {
  /** A crop or resize sent in the `uploadEdits` query. */
  hasCropOrResizeEdit: boolean
  isDuplicating: boolean
  isExternalSource: boolean
  /** The focal point and crop triggers that existed before claims. */
  isLegacyReupload: boolean
  /** The stored `_transforms` on an update; `undefined` when there is nothing to compare. */
  previousTransforms: Document['_transforms'] | undefined
  storedMimeType: string | undefined
} & PlanArgs): Promise<{ rebuildPlan?: UploadPlan; shouldRebuild: boolean }> {
  if (isExternalSource) {
    return { shouldRebuild: true }
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
    return { shouldRebuild: false }
  }

  if (!storedMimeType) {
    return { shouldRebuild: true }
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

  if (shouldRebuild) {
    assertTransformKeysCovered({ ...planArgs, plan: rebuildPlan })
  }

  return { rebuildPlan, shouldRebuild }
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
