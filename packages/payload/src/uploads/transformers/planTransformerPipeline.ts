import type { CanTransformArgs, UploadTransformer } from './types.js'

import { matchesMimeType } from './matchesMimeType.js'

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
}): Promise<UploadTransformer[]> {
  const pipeline: UploadTransformer[] = []

  for (const transformer of getCandidateTransformers({
    capability,
    mimeType: args.mimeType,
    transformers,
  })) {
    if (typeof transformer.canTransform === 'function') {
      const isEligible = await transformer.canTransform(args)

      if (!isEligible) {
        continue
      }
    }

    pipeline.push(transformer)
  }

  return pipeline
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
