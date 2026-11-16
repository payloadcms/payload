import { isDeepStrictEqual } from 'node:util'

import type { Document, PayloadRequest } from '../../types/index.js'
import type { UploadTransformer } from './types.js'

import { TransformerContractError } from '../../errors/TransformerContractError.js'
import { deepCopyObject } from '../../utilities/deepCopyObject.js'
import { getChangedTransformKeys } from '../transformState/getChangedTransformKeys.js'
import { getNonJSONValueError } from '../transformState/transformStateInput.js'
import { getTransformStateError } from '../transformState/validateTransformState.js'
import { createFileSource } from './createFileSource.js'

/**
 * Runs one file through every eligible `transformFile` stage in declaration
 * order. Used both for the ordinary top-level upload call (each stage's own
 * `canTransform` options) and, via the private v4 bridge's `transform` callback,
 * once per legacy task (the main file, crop output, or a named image size) with
 * that task's own `options`. Retains only the current file — never a history array —
 * so passing the same `File` through unchanged never copies its buffer.
 *
 * Each stage gets the same `doc` and changes it in place, so later stages and the caller see
 * earlier `_transforms` changes. A stage that changes any other field, changes a `_transforms` key
 * that another stage claims, or writes a `_transforms` value that is not valid, stops the pipeline
 * with a `TransformerContractError`. Returns the output file.
 */
export async function transformUploadFile({
  claims,
  collectionSlug,
  doc,
  file,
  getOptions,
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
  /** The `options` a stage gets. */
  getOptions: (transformer: UploadTransformer) => unknown
  originalDoc: Readonly<Document>
  originalFile: File
  pipeline: UploadTransformer[]
  req: PayloadRequest
}): Promise<File> {
  const originalSource = createFileSource({ file: originalFile })
  let currentFile = file

  for (const transformer of pipeline) {
    if (typeof transformer.transformFile !== 'function') {
      continue
    }

    const transformsBeforeStage = deepCopyObject(doc._transforms)

    const result = await transformer.transformFile({
      collectionSlug,
      doc,
      file: currentFile,
      options: getOptions(transformer),
      originalDoc,
      originalSource,
      req,
      source: createFileSource({ file: currentFile }),
    })

    assertOnlyTransformsChanged({ doc, originalDoc, transformerSlug: transformer.slug })
    assertNoChangeToOtherClaims({
      claims,
      next: doc._transforms,
      previous: transformsBeforeStage,
      transformer,
    })
    await assertValidTransformsChange({
      next: doc._transforms,
      previous: transformsBeforeStage,
      transformerSlug: transformer.slug,
    })

    if (result.file) {
      currentFile = result.file
    }

    if (result.status === 'complete') {
      return currentFile
    }
  }

  return currentFile
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

/**
 * Draft saves skip field validation, and the JSON copy that checks submitted values runs before
 * the stages. So a value that a stage writes is checked here. Values the stage did not change were
 * already checked, and an error for them must not name the stage.
 */
async function assertValidTransformsChange({
  next,
  previous,
  transformerSlug,
}: {
  next: unknown
  previous: unknown
  transformerSlug: string
}): Promise<void> {
  if (isDeepStrictEqual(next, previous)) {
    return
  }

  const error =
    getNonJSONValueError({ value: next }) ?? (await getTransformStateError({ value: next }))

  if (error) {
    throw new TransformerContractError(
      `The "${transformerSlug}" transformer wrote an invalid _transforms value. ${error}`,
    )
  }
}
