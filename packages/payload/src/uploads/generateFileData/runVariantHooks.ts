import type { Document, PayloadRequest } from '../../types/index.js'
import type { UploadTransformer } from '../transformers/types.js'
import type { UploadTransformation } from '../transformers/uploadTransformerBridge.js'
import type { PlannedHookOwner } from '../transformState/planUpload.js'

import { createFileSource } from '../transformers/createFileSource.js'
import { transformUploadFile } from '../transformers/transformUploadFile.js'

/**
 * Makes one hook owner's stored variants. Core calls the owner's `transformVariant` once for each
 * variant it owns, then runs the other eligible stages on each result. A skipped variant has no
 * file, so it is saved as null, as a Sharp size that is too small to make is.
 */
export async function runVariantHooks({
  claims,
  collectionSlug,
  doc,
  getOptions,
  hookOwner: { options, owner, transformer: ownerTransformer },
  mainFile,
  originalFile,
  pipelineOriginalDoc,
  req,
  signal,
  stagesThatRun,
}: {
  claims: ReadonlyMap<UploadTransformer, string[]>
  collectionSlug: string
  /** A read-only copy of the main file's result, shared by every variant. */
  doc: Readonly<Document>
  /** The `options` each later stage gets. */
  getOptions: (transformer: UploadTransformer) => unknown
  hookOwner: PlannedHookOwner
  /** The main file after the pipeline. */
  mainFile: File
  originalFile: File
  pipelineOriginalDoc: Readonly<Document>
  req: PayloadRequest
  signal: AbortSignal
  stagesThatRun: UploadTransformer[]
}): Promise<UploadTransformation[]> {
  const laterStages = stagesThatRun.filter((stage) => stage !== ownerTransformer)
  const results: UploadTransformation[] = []

  for (const variantName of owner.variantNames) {
    const fieldPath = `variants.${variantName}` as const
    const result = await ownerTransformer.transformVariant({
      collectionSlug,
      doc,
      options,
      originalSource: createFileSource({ file: originalFile }),
      req,
      signal,
      source: createFileSource({ file: mainFile }),
      variantName,
    })

    if (result.status === 'skip') {
      results.push({ fieldPath })
      continue
    }

    const file = await transformUploadFile({
      claims,
      collectionSlug,
      doc,
      file: result.file,
      getOptions,
      originalDoc: pipelineOriginalDoc,
      originalFile,
      pipeline: laterStages,
      req,
    })
    // A later stage can change the file, so the hook's size is kept only for its own file.
    const isHookFile = file === result.file

    results.push({
      fieldPath,
      file,
      height: isHookFile ? result.height : undefined,
      mimeType: file.type,
      width: isHookFile ? result.width : undefined,
    })
  }

  return results
}
