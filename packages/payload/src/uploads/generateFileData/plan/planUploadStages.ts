import type { Document, PayloadRequest } from '../../../types/index.js'
import type { UploadTransformer } from '../../transformers/types.js'
import type { UploadPlan } from '../../transformState/planUpload.js'

import {
  getStagesThatRun,
  planUploadPipeline,
  resolveTransformKeyCoverage,
} from '../../transformState/planUpload.js'
import { isFocalPointKey } from '../../transformState/transformKeyClaims.js'
import { toFileUploadError } from '../utils/toFileUploadError.js'

export type UploadStages = {
  /** The one upload bridge that drives the upload, if the plan has any. */
  bridgeTransformer?: UploadTransformer
  claimsOfStagesThatRun: Map<UploadTransformer, string[]>
  /** Request-time stages apply the saved keys, so the default file is not stored. */
  isAppliedAtRequest: boolean
  /** The upload stages that build stored files. Empty when `isAppliedAtRequest`. */
  pipeline: UploadTransformer[]
  plan: UploadPlan
  stagesThatRun: UploadTransformer[]
}

/**
 * Plans the upload stages for a file of this MIME type, and decides whether the saved keys are
 * applied by upload stages or at request time. A plan made before the file was read is reused
 * when the MIME type is the same.
 */
export async function planUploadStages({
  canApplyAtRequest,
  collectionSlug,
  documentID,
  earlierPlan,
  mimeType,
  pipelineDoc,
  pipelineOriginalDoc,
  req,
}: {
  /** False when no original would be stored for request-time stages to start from. */
  canApplyAtRequest: boolean
  collectionSlug: string
  documentID?: number | string
  /** The rebuild plan, made with the stored MIME type before the stored file was read. */
  earlierPlan?: { isAppliedAtRequest: boolean; plan: UploadPlan }
  mimeType: string
  pipelineDoc: Document
  pipelineOriginalDoc: Readonly<Document>
  req: PayloadRequest
}): Promise<UploadStages> {
  let plan: UploadPlan

  try {
    plan =
      earlierPlan?.plan.mimeType === mimeType
        ? earlierPlan.plan
        : await planUploadPipeline({
            collectionSlug,
            mimeType,
            pipelineDoc,
            pipelineOriginalDoc,
            req,
          })
  } catch (err) {
    throw toFileUploadError({ err, req })
  }

  const { isAppliedAtRequest } =
    plan === earlierPlan?.plan
      ? earlierPlan
      : await resolveTransformKeyCoverage({
          // Request-time stages start from the stored original, so one must be stored.
          canApplyAtRequest,
          collectionSlug,
          documentID,
          mimeType,
          pipelineDoc,
          pipelineOriginalDoc,
          plan,
          req,
        }).catch((err: unknown) => {
          throw toFileUploadError({ err, req })
        })

  return {
    isAppliedAtRequest,
    // Upload stages build stored files. A default file built at request time has none to build.
    pipeline: isAppliedAtRequest ? [] : plan.pipeline,
    plan,
    ...getStagesThatRun({ collectionSlug, plan }),
  }
}

/**
 * The saved keys without the ones that the stages that run claim. A duplicate of a stored upload
 * is made from the source's main file, which already has those keys applied, so the copy drops
 * them and they are not applied twice. A focal point only guides sizes, so it is kept.
 */
export function withoutAppliedKeys({
  stages,
  transforms,
}: {
  stages: Pick<UploadStages, 'claimsOfStagesThatRun'>
  transforms: NonNullable<Document['_transforms']>
}): Document['_transforms'] {
  const appliedKeys = [...stages.claimsOfStagesThatRun.values()]
    .flat()
    .filter((key) => !isFocalPointKey(key))
  const keptTransforms = Object.fromEntries(
    Object.entries(transforms).filter(([key]) => !appliedKeys.includes(key)),
  )

  return Object.keys(keptTransforms).length ? keptTransforms : null
}
