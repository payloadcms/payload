import type { PayloadRequest } from '../../types/index.js'
import type { FileSource, PlannedTransformer, UploadDocument, UploadTransformer } from './types.js'

import { TransformerContractError } from '../../errors/TransformerContractError.js'
import { validateTransformState } from '../transformState/validateTransformState.js'
import { createDocumentSnapshot } from './createDocumentSnapshot.js'
import { createFileSource } from './createFileSource.js'
import { matchesMimeType } from './matchesMimeType.js'
import { planTransformerPipeline } from './planTransformerPipeline.js'

/** Runs sequential stages with an immutable entry snapshot and stage-owned options. */
type Args = {
  collectionSlug: string
  doc?: UploadDocument
  file?: File
  originalDoc?: Readonly<UploadDocument>
  originalSource?: FileSource
  pipeline: PlannedTransformer[]
  req: PayloadRequest
  source?: FileSource
  transformers?: UploadTransformer[]
}

export function transformUploadFile(args: { file: File } & Args): Promise<File>
export function transformUploadFile(args: { source: FileSource } & Args): Promise<File | undefined>
export async function transformUploadFile({
  collectionSlug,
  doc = {},
  file,
  originalDoc = createDocumentSnapshot({ doc }),
  originalSource,
  pipeline,
  req,
  source,
  transformers = req.payload?.config.upload?.transformers ??
    pipeline.map(({ transformer }) => transformer),
}: Args): Promise<File | undefined> {
  let accumulator = file
  let currentSource = source ?? createFileSource({ file: file! })
  const entrySource = originalSource ?? currentSource

  const initialMimeType = currentSource.mimeType
  const stages = transformers.map((transformer) => ({
    planned: pipeline.find((stage) => stage.transformer === transformer),
    transformer,
  }))

  for (const [index, { planned, transformer }] of stages.entries()) {
    if (typeof transformer.transformFile !== 'function') {
      continue
    }

    const isMatchingMimeType = transformer.mimeTypes.some((pattern) =>
      matchesMimeType({ mimeType: currentSource.mimeType, pattern }),
    )

    if (!isMatchingMimeType && planned?.handledTransformKeys?.length) {
      throw new TransformerContractError(
        `Transformer ${transformer.slug} cannot handle the current source MIME type ${currentSource.mimeType}.`,
      )
    }
    // Explicit pipelines without a MIME type remain compatible with legacy File callers.
    if (!isMatchingMimeType && currentSource.mimeType) {
      continue
    }

    const stage =
      planned ??
      (currentSource.mimeType !== initialMimeType
        ? (
            await planTransformerPipeline({
              args: { collectionSlug, doc, operation: 'upload', originalDoc, req },
              capability: 'transformFile',
              mimeType: currentSource.mimeType,
              transformers: [transformer],
            })
          )[0]
        : undefined)

    if (!stage) {
      continue
    }

    const result = await transformer.transformFile({
      collectionSlug,
      doc,
      options: stage.options,
      originalDoc,
      originalSource: entrySource,
      req,
      source: currentSource,
    })

    if (result.file) {
      accumulator = result.file
      currentSource = createFileSource({ file: accumulator })
      doc.mimeType = accumulator.type
    }

    validateTransformState({ collectionSlug, doc, req, value: doc._transforms })

    if (result.status === 'complete') {
      if (stages.slice(index + 1).some(({ planned }) => planned?.handledTransformKeys?.length)) {
        throw new TransformerContractError(
          'A transformer completed before all saved transforms were satisfied.',
        )
      }
      return accumulator
    }
  }

  return accumulator
}
