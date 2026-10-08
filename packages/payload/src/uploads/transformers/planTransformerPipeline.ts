import type { CanTransformArgs, PlannedTransformer, UploadTransformer } from './types.js'

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
  mimeType,
  transformers,
}: {
  args: CanTransformArgs
  capability: TransformerCapability
  mimeType?: string
  transformers: UploadTransformer[]
}): Promise<PlannedTransformer[]> {
  const pipeline: PlannedTransformer[] = []

  // Saved intent is claimed before source reads, including stages that may become
  // compatible after an earlier conversion. Execution checks the actual stage MIME.
  const hasSavedWork =
    args.doc._transforms &&
    Object.keys(args.doc._transforms).length &&
    (args.operation === 'upload' ||
      args.purpose === 'persisted-default' ||
      args.purpose === 'preview')
  const candidates = hasSavedWork
    ? transformers.filter((transformer) => typeof transformer[capability] === 'function')
    : getCandidateTransformers({
        capability,
        mimeType: mimeType ?? args.doc.mimeType,
        transformers,
      })

  for (const transformer of candidates) {
    const result =
      typeof transformer.canTransform === 'function' ? await transformer.canTransform(args) : true

    if (!result) {
      continue
    }

    pipeline.push({
      ...(typeof result === 'object' && result.handledTransformKeys
        ? { handledTransformKeys: result.handledTransformKeys }
        : {}),
      options: typeof result === 'object' ? result.options : undefined,
      transformer,
    })
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
