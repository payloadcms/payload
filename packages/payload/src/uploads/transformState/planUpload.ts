import type { Document, PayloadRequest } from '../../types/index.js'
import type { HookVariantOwner } from '../getVariantOwners.js'
import type { PlannedTransformerPipeline } from '../transformers/planTransformerPipeline.js'
import type { CanTransformArgs, UploadTransformer } from '../transformers/types.js'

import { ValidationError } from '../../errors/ValidationError.js'
import { getHookVariantOwners, getVariantOwners } from '../getVariantOwners.js'
import {
  getCandidateTransformers,
  getCanTransformResult,
  isEligible,
  planTransformerPipeline,
} from '../transformers/planTransformerPipeline.js'
import { getUploadTransformerInternal } from '../transformers/uploadTransformerBridge.js'
import { getChangedTransformKeys } from './getChangedTransformKeys.js'
import { getTransformKeyCoverageErrors } from './getTransformKeyCoverageErrors.js'
import { planPersistedDefaultStages } from './planPersistedDefaultStages.js'
import { isClaimRequired, isFocalPointKey } from './transformKeyClaims.js'

/** A variants owner whose `transformVariant` makes its stored variants for this upload. */
export type PlannedHookOwner = {
  /** The `options` from the transformer's own `canTransform` result, or `undefined`. */
  options: unknown
} & HookVariantOwner

export type UploadPlan = {
  /** The variants owners whose `transformVariant` runs, in the order they registered. */
  hookOwners: PlannedHookOwner[]
  mimeType: string
} & PlannedTransformerPipeline

/**
 * What an upload with no new file does with its stored file.
 * - `keep`: nothing changes the file, so the stored files stay.
 * - `rebuild`: upload stages build new files from the stored file.
 * - `applyAtRequest`: request-time stages apply the saved keys, so no file is read or written.
 * - `copyForRequest`: a copy reads the source's original to store its own, and request-time stages
 *   apply the saved keys. No upload stage runs.
 */
export type UploadRebuildOutcome = 'applyAtRequest' | 'copyForRequest' | 'keep' | 'rebuild'

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
  hasCropOrFocalPointEdit,
  hasCropOrResizeEdit,
  isDuplicating,
  isExternalSource,
  previousTransforms,
  storedMimeType,
  ...planArgs
}: {
  /** False when no original would be stored for request-time stages to start from. */
  canApplyAtRequest: boolean
  documentID?: number | string
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
} & PlanArgs): Promise<{ outcome: UploadRebuildOutcome; rebuildPlan?: UploadPlan }> {
  if (isExternalSource) {
    return { outcome: 'rebuild' }
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
    return { outcome: 'keep' }
  }

  if (!storedMimeType) {
    return { outcome: 'rebuild' }
  }

  const rebuildPlan = await planUploadPipeline({
    ...planArgs,
    canApplyAtRequest,
    documentID,
    mimeType: storedMimeType,
  })
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

  if (!shouldRebuild) {
    return { outcome: 'keep', rebuildPlan }
  }

  const { isAppliedAtRequest } = await resolveTransformKeyCoverage({
    ...planArgs,
    canApplyAtRequest,
    documentID,
    mimeType: storedMimeType,
    plan: rebuildPlan,
  })

  if (!isAppliedAtRequest) {
    return { outcome: 'rebuild', rebuildPlan }
  }

  return { outcome: isDuplicating ? 'copyForRequest' : 'applyAtRequest', rebuildPlan }
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
  canApplyAtRequest,
  documentID,
  mimeType,
  ...planArgs
}: {
  /** False when no original would be stored for request-time stages to start from. */
  canApplyAtRequest: boolean
  documentID?: number | string
  mimeType: string
} & PlanArgs): Promise<UploadPlan> {
  const { collectionSlug, pipelineOriginalDoc, req } = planArgs
  const canTransformArgs: CanTransformArgs = {
    collectionSlug,
    doc: pipelineOriginalDoc,
    mimeType,
    operation: 'upload',
    originalDoc: pipelineOriginalDoc,
    req,
  }
  const transformers = req.payload.config.upload?.transformers ?? []
  const plan = await planTransformerPipeline({
    args: canTransformArgs,
    capability: 'transformFile',
    transformers,
  })
  const hookOwners = await planHookOwners({ args: canTransformArgs, stagePlan: plan, transformers })

  const variantsOwnerSlug = canApplyAtRequest
    ? await getVariantsOwnerThatBuildsAtRequest({ ...planArgs, documentID, mimeType })
    : undefined

  return {
    ...(variantsOwnerSlug
      ? withoutBridgesThatDoNotOwnCollection({ collectionSlug, plan, variantsOwnerSlug })
      : plan),
    hookOwners,
    mimeType,
  }
}

/**
 * The variants owners for this MIME type whose `transformVariant` runs. Each one runs only when
 * its own `canTransform` passes. A transformer that is also an upload stage was already asked by
 * the stage plan, so its result and options are reused and `canTransform` is not called again.
 */
async function planHookOwners({
  args,
  stagePlan,
  transformers,
}: {
  args: CanTransformArgs
  stagePlan: PlannedTransformerPipeline
  transformers: UploadTransformer[]
}): Promise<PlannedHookOwner[]> {
  const upload = args.req.payload.collections?.[args.collectionSlug]?.config.upload
  const stageCandidates = getCandidateTransformers({
    capability: 'transformFile',
    mimeType: args.mimeType,
    transformers,
  })
  const plannedHookOwners: PlannedHookOwner[] = []

  for (const hookOwner of getHookVariantOwners({ mimeType: args.mimeType, transformers, upload })) {
    const { transformer } = hookOwner

    if (stagePlan.pipeline.includes(transformer)) {
      plannedHookOwners.push({ ...hookOwner, options: stagePlan.options.get(transformer) })
      continue
    }

    // A stage candidate that is not in the plan already returned false.
    if (stageCandidates.includes(transformer)) {
      continue
    }

    const result = await getCanTransformResult({ args, transformer })

    if (isEligible({ result })) {
      plannedHookOwners.push({
        ...hookOwner,
        options: typeof result === 'object' ? result.options : undefined,
      })
    }
  }

  return plannedHookOwners
}

/**
 * The slug of the first transformer that makes variants for this MIME type, when it can build the
 * default file and the sizes from the original at request time. Otherwise `undefined`.
 */
async function getVariantsOwnerThatBuildsAtRequest({
  documentID,
  mimeType,
  ...planArgs
}: { documentID?: number | string; mimeType: string } & PlanArgs): Promise<string | undefined> {
  const upload = planArgs.req.payload.collections?.[planArgs.collectionSlug]?.config.upload

  if (!upload?.variants?.length) {
    return undefined
  }

  for (const { slug } of getVariantOwners({ mimeType, upload })) {
    const canOwnerBuild = await canBuildAtRequest({
      ...planArgs,
      documentID,
      mimeType,
      requiredTransformerSlug: slug,
    })

    if (canOwnerBuild) {
      return slug
    }
  }

  return undefined
}

/**
 * The plan without the upload bridges that are not the variants owner for this file. The owner
 * that builds this MIME type's variants at request time also builds the main file, so a bridge
 * must not build a main file that differs from those variants. The owner and a bridge that the
 * collection is configured on still run.
 */
function withoutBridgesThatDoNotOwnCollection({
  collectionSlug,
  plan,
  variantsOwnerSlug,
}: {
  collectionSlug: string
  plan: PlannedTransformerPipeline
  variantsOwnerSlug: string
}): PlannedTransformerPipeline {
  const isKept = (transformer: UploadTransformer): boolean => {
    const bridge = getUploadTransformerInternal(transformer)

    return (
      !bridge?.transformUpload ||
      transformer.slug === variantsOwnerSlug ||
      Boolean(bridge.handlesCollection?.({ collectionSlug }))
    )
  }

  return {
    claims: new Map([...plan.claims].filter(([transformer]) => isKept(transformer))),
    options: new Map([...plan.options].filter(([transformer]) => isKept(transformer))),
    pipeline: plan.pipeline.filter(isKept),
  }
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
    Boolean(getUploadTransformerInternal(transformer)?.transformUpload),
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
  // Every output must apply the saved keys. Sizes are stored at upload unless their owner builds
  // them at request time, so each owner of this MIME type must be a request-time stage too.
  const upload = req.payload.collections?.[collectionSlug]?.config.upload
  const owners = getVariantOwners({ mimeType, upload })
  // A file with no variants owner for its MIME type gets no variants, so only the main file must
  // apply the saved keys.
  const requiredSlugs = owners.length > 0 ? owners.map(({ slug }) => slug) : [undefined]
  let canBuildEveryOutputAtRequest = canApplyAtRequest && hasOnlyUnclaimedKeys

  for (const requiredTransformerSlug of requiredSlugs) {
    canBuildEveryOutputAtRequest =
      canBuildEveryOutputAtRequest &&
      (await canBuildAtRequest({
        collectionSlug,
        documentID,
        mimeType,
        pipelineDoc,
        pipelineOriginalDoc,
        req,
        requiredTransformerSlug,
      }))
  }

  if (canBuildEveryOutputAtRequest) {
    return { isAppliedAtRequest: true }
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

/**
 * Whether request-time stages can build a file of this MIME type from the original, applying every
 * saved key. With `requiredTransformerSlug`, that transformer must also be one of the stages.
 */
export async function canBuildAtRequest({
  requiredTransformerSlug,
  ...buildArgs
}: {
  requiredTransformerSlug?: string
} & RequestTimeBuildArgs): Promise<boolean> {
  return isBuildableAtRequest({
    requestTimeBuild: await planRequestTimeBuild(buildArgs),
    requiredTransformerSlug,
  })
}

type RequestTimeBuildArgs = {
  documentID?: number | string
  mimeType: string
} & PlanArgs

export type RequestTimeBuildPlan = Awaited<ReturnType<typeof planPersistedDefaultStages>>

/**
 * Plans the request-time stages that would build a file of this MIME type from the original. Check
 * the result with `isBuildableAtRequest`. Use both to check more than one condition on one plan.
 */
export function planRequestTimeBuild({
  collectionSlug,
  documentID,
  mimeType,
  pipelineDoc,
  pipelineOriginalDoc,
  req,
}: RequestTimeBuildArgs): Promise<RequestTimeBuildPlan> {
  return planPersistedDefaultStages({
    collectionSlug,
    doc: pipelineOriginalDoc,
    documentID,
    mimeType,
    req,
    transforms: pipelineDoc._transforms,
  })
}

/**
 * Whether a planned request-time build has stages that apply every saved key. With
 * `requiredTransformerSlug`, that transformer must also be one of the stages.
 */
export function isBuildableAtRequest({
  requestTimeBuild: { coverageErrors, plan },
  requiredTransformerSlug,
}: {
  requestTimeBuild: RequestTimeBuildPlan
  requiredTransformerSlug?: string
}): boolean {
  return (
    plan.pipeline.length > 0 &&
    (requiredTransformerSlug === undefined ||
      plan.pipeline.some((transformer) => transformer.slug === requiredTransformerSlug)) &&
    coverageErrors.length === 0
  )
}

/**
 * Whether a planned request-time build can build a variant. The variant's owner for the file's
 * MIME type (`getVariantOwner`) must be one of the stages.
 */
export function areVariantsBuildableAtRequest({
  requestTimeBuild,
  variantsOwnerSlug,
}: {
  requestTimeBuild: RequestTimeBuildPlan
  variantsOwnerSlug?: string
}): boolean {
  return (
    Boolean(variantsOwnerSlug) &&
    isBuildableAtRequest({ requestTimeBuild, requiredTransformerSlug: variantsOwnerSlug })
  )
}
