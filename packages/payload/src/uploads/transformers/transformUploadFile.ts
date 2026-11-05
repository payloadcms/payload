import { isDeepStrictEqual } from 'node:util'

import type { Document, PayloadRequest } from '../../types/index.js'
import type { UploadTransformer } from './types.js'

import { TransformerContractError } from '../../errors/TransformerContractError.js'
import { deepCopyObject } from '../../utilities/deepCopyObject.js'
import { getChangedTransformKeys } from '../transformState/getChangedTransformKeys.js'
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
 * that changes any other field, or a `_transforms` key that another stage claims, stops the
 * pipeline with a `TransformerContractError`.
 */
export async function transformUploadFile({
  claims,
  collectionSlug,
  doc,
  file,
  options,
  originalDoc,
  originalFile,
  pipeline,
  req,
}: {
  /** The `_transforms` keys each stage that runs claims. */
  claims: ReadonlyMap<UploadTransformer, string[]>
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

    const transformsBeforeStage = deepCopyObject(doc._transforms)

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
    assertNoChangeToOtherClaims({
      claims,
      next: doc._transforms,
      previous: transformsBeforeStage,
      transformer,
    })

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

/**
 * A stage may not change a `_transforms` key that another stage claims. The claiming stage may
 * have read its value already: the Sharp bridge gets its crop before any stage runs. The saved
 * value would then not match the file.
 *
 * Rejecting is the simple choice for now. To allow it later, core would read `_transforms` again
 * after each stage and give the new value to the claiming stage.
 */
function assertNoChangeToOtherClaims({
  claims,
  next,
  previous,
  transformer,
}: {
  claims: ReadonlyMap<UploadTransformer, string[]>
  next: Document['_transforms']
  previous: Document['_transforms']
  transformer: UploadTransformer
}): void {
  for (const key of getChangedTransformKeys({ next, previous })) {
    for (const [claimer, claimedKeys] of claims) {
      if (claimer !== transformer && claimedKeys.includes(key)) {
        throw new TransformerContractError(
          `The "${transformer.slug}" transformer changed _transforms.${key}, which the "${claimer.slug}" transformer applies.`,
        )
      }
    }
  }
}
