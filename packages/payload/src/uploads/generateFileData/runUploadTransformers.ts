import { openAsBlob } from 'node:fs'

import type { Document, PayloadRequest } from '../../types/index.js'
import type { FileSource, UploadTransformer } from '../transformers/types.js'
import type { UploadTransformation } from '../transformers/uploadTransformerBridge.js'
import type { UploadStages } from './plan/planUploadStages.js'

import { deepCopyObject } from '../../utilities/deepCopyObject.js'
import { deepFreeze } from '../../utilities/deepFreeze.js'
import { createFileSource } from '../transformers/createFileSource.js'
import { transformUploadFile } from '../transformers/transformUploadFile.js'
import {
  getUploadTransformerInternal,
  setUploadFilePath,
} from '../transformers/uploadTransformerBridge.js'
import { assertTransformKeysCovered } from '../transformState/planUpload.js'
import { runVariantHooks } from './runVariantHooks.js'

export type UploadTransformerOutput = {
  /**
   * The main file's size from the upload bridge. Set when the bridge ran, also when it gave no
   * size, so the saved size then follows the bridge and is not probed from the file.
   */
  bridgeDimensions?: { height?: number; width?: number }
  /** The upload bridge that ran, if one did. */
  bridgeTransformer?: UploadTransformer
  /** The owners whose `transformVariant` made this upload's variants. */
  hookOwnerSlugs: string[]
  /**
   * The incoming file, as the stages received it. Unset when the hook owners read a client upload
   * by byte ranges. Always set when `transformedMainFile` is set.
   */
  originalFile?: File
  /** The sizes that the upload bridge built. */
  sizeResults: UploadTransformation[]
  /** The main file that the stages returned, when it is not the incoming file. */
  transformedMainFile?: File
  /** The final `_transforms` of the transformer `doc`, after every stage ran. */
  transforms: Document['_transforms']
}

/**
 * Runs the upload stages on the incoming file. With an upload bridge, the bridge drives the stages
 * once for the main file and once for each size. Otherwise the stages run once for the main file,
 * and each planned hook owner makes its variants.
 *
 * The stages can change `pipelineDoc._transforms`. Only the main task's changes are kept: size
 * tasks share a read-only copy of the main task's result.
 */
export async function runUploadTransformers({
  collectionSlug,
  cropSize,
  file,
  pipelineDoc,
  pipelineOriginalDoc,
  req,
  stages: { bridgeTransformer, claimsOfStagesThatRun, hookOwners, pipeline, plan, stagesThatRun },
}: {
  collectionSlug: string
  /** The pixel size of a crop that the request sent, for the upload bridge. */
  cropSize?: { height: number; width: number }
  /** The incoming file, with its whole contents. */
  file: NonNullable<PayloadRequest['file']>
  pipelineDoc: Document
  pipelineOriginalDoc: Readonly<Document>
  req: PayloadRequest
  stages: Pick<
    UploadStages,
    | 'bridgeTransformer'
    | 'claimsOfStagesThatRun'
    | 'hookOwners'
    | 'pipeline'
    | 'plan'
    | 'stagesThatRun'
  >
}): Promise<UploadTransformerOutput> {
  const originalFile = await toWebFile({ file })
  const originalSource = createFileSource({ file: originalFile })
  let mainFile: File
  let bridgeDimensions: UploadTransformerOutput['bridgeDimensions']
  let sizeResults: UploadTransformation[] = []
  let hookOwnerSlugs: string[] = []

  // Hook owners do not run on the bridge path until Sharp moves onto the hook.
  if (bridgeTransformer) {
    const bridge = getUploadTransformerInternal(bridgeTransformer)!
    let sizeTaskDoc: Readonly<Document> | undefined

    const results = await bridge.transformUpload!({
      collectionSlug,
      cropSize,
      file: originalFile,
      req,
      transform: async (task) => {
        // Size tasks run after the main task, maybe in parallel, so only the main task's
        // changes are kept and the size tasks share a read-only copy of its result.
        const taskDoc =
          task.fieldPath === 'filename'
            ? pipelineDoc
            : (sizeTaskDoc ??= deepFreeze(deepCopyObject(pipelineDoc)))

        return transformUploadFile({
          claims: claimsOfStagesThatRun,
          collectionSlug,
          doc: taskDoc,
          file: task.file ?? originalFile,
          // A stage that returned no options keeps getting the bridge's task options, as before.
          getOptions: (transformer) =>
            transformer === bridgeTransformer || !plan.options.has(transformer)
              ? task.options
              : plan.options.get(transformer),
          originalDoc: pipelineOriginalDoc,
          originalSource,
          pipeline: stagesThatRun,
          req,
        })
      },
    })

    const mainResult = results.find((result) => result.fieldPath === 'filename')

    mainFile = mainResult?.file ?? originalFile
    bridgeDimensions = { height: mainResult?.height, width: mainResult?.width }
    sizeResults = results.filter((result) => result.fieldPath !== 'filename')
  } else {
    mainFile = await transformUploadFile({
      claims: claimsOfStagesThatRun,
      collectionSlug,
      doc: pipelineDoc,
      file: originalFile,
      getOptions: (transformer) => plan.options.get(transformer),
      originalDoc: pipelineOriginalDoc,
      originalSource,
      pipeline,
      req,
    })

    if (hookOwners.length > 0) {
      sizeResults = await runHookOwners({
        collectionSlug,
        originalSource,
        pipelineDoc,
        pipelineOriginalDoc,
        req,
        source: mainFile === originalFile ? originalSource : createFileSource({ file: mainFile }),
        stages: { claimsOfStagesThatRun, hookOwners, plan, stagesThatRun },
      })
      hookOwnerSlugs = hookOwners.map(({ owner }) => owner.slug)
    }
  }

  // Planning checked `_transforms` before the stages ran. A stage can add or change a key, so
  // check the final value too, or a key nobody applies would be saved.
  assertTransformKeysCovered({ collectionSlug, pipelineDoc, plan, req })

  return {
    bridgeDimensions,
    bridgeTransformer,
    hookOwnerSlugs,
    originalFile,
    sizeResults,
    transformedMainFile: mainFile !== originalFile ? mainFile : undefined,
    transforms: pipelineDoc._transforms,
  }
}

/**
 * Runs only the planned hook owners on a source, with no main-file stage and no upload bridge.
 * Used for a client upload that the owners read by byte ranges from storage, so the main file and
 * the original are the stored object.
 */
export async function runHookOwnersOnSource({
  collectionSlug,
  fileSource,
  pipelineDoc,
  pipelineOriginalDoc,
  req,
  stages,
}: {
  collectionSlug: string
  fileSource: FileSource
  pipelineDoc: Document
  pipelineOriginalDoc: Readonly<Document>
  req: PayloadRequest
  stages: Pick<UploadStages, 'claimsOfStagesThatRun' | 'hookOwners' | 'plan' | 'stagesThatRun'>
}): Promise<UploadTransformerOutput> {
  const sizeResults = await runHookOwners({
    collectionSlug,
    originalSource: fileSource,
    pipelineDoc,
    pipelineOriginalDoc,
    req,
    source: fileSource,
    stages,
  })

  assertTransformKeysCovered({ collectionSlug, pipelineDoc, plan: stages.plan, req })

  return {
    hookOwnerSlugs: stages.hookOwners.map(({ owner }) => owner.slug),
    sizeResults,
    transforms: pipelineDoc._transforms,
  }
}

/** Each planned hook owner makes its variants from the main file. */
async function runHookOwners({
  collectionSlug,
  originalSource,
  pipelineDoc,
  pipelineOriginalDoc,
  req,
  source,
  stages: { claimsOfStagesThatRun, hookOwners, plan, stagesThatRun },
}: {
  collectionSlug: string
  originalSource: FileSource
  pipelineDoc: Document
  pipelineOriginalDoc: Readonly<Document>
  req: PayloadRequest
  /** The main file after the pipeline. */
  source: FileSource
  stages: Pick<UploadStages, 'claimsOfStagesThatRun' | 'hookOwners' | 'plan' | 'stagesThatRun'>
}): Promise<UploadTransformation[]> {
  // Variants share a read-only copy of the main file's result, as the bridge's size tasks do.
  const variantDoc = deepFreeze(deepCopyObject(pipelineDoc))
  // Nothing aborts an upload request yet. A background job will pass its own signal.
  const { signal } = new AbortController()
  const sizeResults: UploadTransformation[] = []

  for (const hookOwner of hookOwners) {
    sizeResults.push(
      ...(await runVariantHooks({
        claims: claimsOfStagesThatRun,
        collectionSlug,
        doc: variantDoc,
        getOptions: (transformer) => plan.options.get(transformer),
        hookOwner,
        originalSource,
        pipelineOriginalDoc,
        req,
        signal,
        source,
        stagesThatRun,
      })),
    )
  }

  return sizeResults
}

/** The upload as a web `File`. A temp file is read lazily, and its path is kept for Sharp. */
async function toWebFile({ file }: { file: NonNullable<PayloadRequest['file']> }): Promise<File> {
  const fileContents = file.tempFilePath ? await openAsBlob(file.tempFilePath) : file.data
  const webFile = new File([fileContents], file.name, { type: file.mimetype })

  return file.tempFilePath ? setUploadFilePath(webFile, file.tempFilePath) : webFile
}
