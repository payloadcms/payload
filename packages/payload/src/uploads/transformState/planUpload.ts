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
  hasCropOrFocalPointEdit,
  hasCropOrResizeEdit,
  isDuplicating,
  isExternalSource,
  previousTransforms,
  storedMimeType,
  ...planArgs
}: {
  /**
   * A crop or resize in `uploadEdits`, or a focal point that differs from the stored one
   * (`shouldReupload`). These triggers rebuilt the file before claims existed.
   */
  hasCropOrFocalPointEdit: boolean
  /** A crop or resize sent in the `uploadEdits` query. */
  hasCropOrResizeEdit: boolean
  isDuplicating: boolean
  isExternalSource: boolean
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

  if (!isDuplicating && !hasNonFocalPointChange && !hasCropOrFocalPointEdit) {
    return { shouldRebuild: false }
  }

  if (!storedMimeType) {
    return { shouldRebuild: true }
  }

  const rebuildPlan = await planUploadPipeline({ ...planArgs, mimeType: storedMimeType })
  const hasRequiredChange =
    isDuplicating || hasCropOrResizeEdit || changedKeys.some(isClaimRequired)
  const shouldRebuild =
    hasRequiredChange ||
    hasClaimedOptionalChange({
      changedKeys,
      collectionSlug: planArgs.collectionSlug,
      hasCropOrFocalPointEdit,
      plan: rebuildPlan,
    })

  if (shouldRebuild) {
    assertTransformKeysCovered({ ...planArgs, plan: rebuildPlan })
  }

  return { rebuildPlan, shouldRebuild }
}

/**
 * Whether a stage that runs claims a changed key that rebuilds the file only when claimed: a
 * focal point or a custom key. An edit sent through `uploadEdits`, `focalX` or `focalY` is not in
 * `changedKeys`, because those inputs predate `_transforms`; it counts as a focal point change.
 */
function hasClaimedOptionalChange({
  changedKeys,
  collectionSlug,
  hasCropOrFocalPointEdit,
  plan,
}: {
  changedKeys: string[]
  collectionSlug: string
  hasCropOrFocalPointEdit: boolean
  plan: UploadPlan
}): boolean {
  const optionalChangedKeys = changedKeys.filter((key) => !isClaimRequired(key))

  if (hasCropOrFocalPointEdit) {
    optionalChangedKeys.push('focalPoint')
  }

  return getStagesThatRun({ collectionSlug, plan }).stagesThatRun.some((transformer) =>
    plan.claims.get(transformer)?.some((key) => optionalChangedKeys.includes(key)),
  )
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
 * collection, or the first. The other bridges do not run, so they do not count as claimers, and
 * they must not see the chosen bridge's task options, which are private to it.
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
