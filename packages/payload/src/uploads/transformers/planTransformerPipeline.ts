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
  capability: 'handleRequest' | 'transformFile'
  transformers: UploadTransformer[]
}): Promise<UploadTransformer[]> {
  const pipeline: UploadTransformer[] = []

  for (const transformer of transformers) {
    if (typeof transformer[capability] !== 'function') {
      continue
    }

    const matchesAnyMimeType = transformer.mimeTypes.some((pattern) =>
      matchesMimeType({ mimeType: args.mimeType, pattern }),
    )

    if (!matchesAnyMimeType) {
      continue
    }

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
