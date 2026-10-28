import type { CanTransformArgs, CanTransformResult, UploadTransformer } from './types.js'

import { TransformerContractError } from '../../errors/TransformerContractError.js'
import { matchesMimeType } from './matchesMimeType.js'

export type PlannedTransformerPipeline = {
  /** The `_transforms` keys each planned transformer claims. Empty when it claims none. */
  claims: Map<UploadTransformer, string[]>
  pipeline: UploadTransformer[]
}

/**
 * Builds the fixed, ordered list of transformers eligible for one upload or
 * dynamic-request operation. Pure and side-effect-free beyond invoking each
 * candidate's own `canTransform`: it never calls `transformFile`/`handleRequest`
 * and performs no storage or access work. A thrown/rejected `canTransform` aborts
 * planning immediately rather than being treated as `false`.
 */
export async function planTransformerPipeline({
  args,
  capability,
  transformers,
}: {
  args: CanTransformArgs
  capability: TransformerCapability
  transformers: UploadTransformer[]
}): Promise<PlannedTransformerPipeline> {
  const claims = new Map<UploadTransformer, string[]>()
  const pipeline: UploadTransformer[] = []

  for (const transformer of getCandidateTransformers({
    capability,
    mimeType: args.mimeType,
    transformers,
  })) {
    const result: CanTransformResult =
      typeof transformer.canTransform === 'function' ? await transformer.canTransform(args) : true

    if (result !== true && (typeof result !== 'object' || result?.canTransform !== true)) {
      continue
    }

    claims.set(transformer, getHandledTransformKeys({ result, transformer }))
    pipeline.push(transformer)
  }

  return { claims, pipeline }
}

/**
 * The transformers that implement `capability` and declare a MIME pattern matching
 * `mimeType`, before `canTransform` narrows them. Runs no application-defined code,
 * so it is safe to call before access control has been checked.
 */
export function getCandidateTransformers({
  capability,
  mimeType,
  transformers,
}: {
  capability: TransformerCapability
  mimeType: string
  transformers: UploadTransformer[]
}): UploadTransformer[] {
  return transformers.filter(
    (transformer) =>
      typeof transformer[capability] === 'function' &&
      transformer.mimeTypes.some((pattern) => matchesMimeType({ mimeType, pattern })),
  )
}

type TransformerCapability = 'handleRequest' | 'transformFile'

function getHandledTransformKeys({
  result,
  transformer,
}: {
  result: CanTransformResult
  transformer: UploadTransformer
}): string[] {
  const keys = typeof result === 'object' ? result.handledTransformKeys : undefined

  if (keys === undefined) {
    return []
  }

  if (!Array.isArray(keys) || keys.some((key) => typeof key !== 'string' || key.length === 0)) {
    throw new TransformerContractError(
      `The "${transformer.slug}" transformer returned an invalid \`handledTransformKeys\`: expected an array of non-empty strings.`,
    )
  }

  return keys
}
