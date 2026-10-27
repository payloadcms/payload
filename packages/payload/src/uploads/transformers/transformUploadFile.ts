import { isDeepStrictEqual } from 'node:util'

import type { Document, PayloadRequest } from '../../types/index.js'
import type { UploadTransformer } from './types.js'

import { TransformerContractError } from '../../errors/TransformerContractError.js'
import { createFileSource } from './createFileSource.js'

/**
 * Runs one file through every eligible `transformFile` stage in declaration
 * order. Used both for the ordinary top-level upload call (`options: undefined`)
 * and, via the private v4 bridge's `transform` callback, once per legacy task
 * (the main file, crop output, or a named image size) with that task's own
 * `options`. Retains only the current accumulator — never a history array —
 * so passing the same `File` through unchanged never copies its buffer.
 *
 * Each stage gets the same `doc`, so later stages see earlier `_transforms` changes. A stage
 * that changes any other field stops the pipeline with a `TransformerContractError`.
 */
export async function transformUploadFile({
  collectionSlug,
  doc,
  file,
  options,
  originalDoc,
  originalFile,
  pipeline,
  req,
}: {
  collectionSlug: string
  doc: Document
  file: File
  options: unknown
  originalDoc: Readonly<Document>
  originalFile: File
  pipeline: UploadTransformer[]
  req: PayloadRequest
}): Promise<{ doc: Document; file: File }> {
  const originalSource = createFileSource({ file: originalFile })
  let accumulator = file

  for (const transformer of pipeline) {
    if (typeof transformer.transformFile !== 'function') {
      continue
    }

    const result = await transformer.transformFile({
      collectionSlug,
      doc,
      file: accumulator,
      options,
      originalDoc,
      originalSource,
      req,
      source: createFileSource({ file: accumulator }),
    })

    assertOnlyTransformsChanged({ doc, originalDoc, transformerSlug: transformer.slug })

    if (result.file) {
      accumulator = result.file
    }

    if (result.status === 'complete') {
      return { doc, file: accumulator }
    }
  }

  return { doc, file: accumulator }
}

/**
 * Core writes the upload fields from the output file, and the other fields belong to the
 * operation's data, so a transformer may only change `_transforms`.
 */
function assertOnlyTransformsChanged({
  doc,
  originalDoc,
  transformerSlug,
}: {
  doc: Document
  originalDoc: Readonly<Document>
  transformerSlug: string
}): void {
  const { _transforms: _docTransforms, ...docFields } = doc
  const { _transforms: _originalTransforms, ...originalFields } = originalDoc

  if (!isDeepStrictEqual(docFields, originalFields)) {
    throw new TransformerContractError(
      `The "${transformerSlug}" transformer changed a document field other than _transforms.`,
    )
  }
}
