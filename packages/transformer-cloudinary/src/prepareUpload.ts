import type { FocalPoint } from 'payload'
import type { PreparedUploadTransformation, UploadTransformerInternal } from 'payload/internal'

import { isNumber } from 'payload/shared'

import type {
  CloudinaryCollectionConfig,
  CloudinaryImageSizeOptions,
  CloudinaryTransformation,
  CloudinaryUploadTaskOptions,
  ResolvedCloudinaryConfig,
} from './types.js'

import {
  buildImageSizeTransformation,
  buildMainTransformationChain,
} from './buildTransformation.js'
import { canTransformImage } from './canTransformImage.js'
import { getImageSizeAction } from './getImageSizeAction.js'
import { deleteOriginal, generateDerivedAssets, uploadOriginal } from './uploadSession.js'

const percentToPixel = (value: number, dimension: number) => Math.floor((value / 100) * dimension)

type PlannedTask = {
  chain: CloudinaryTransformation[]
  fieldPath: 'filename' | `sizes.${string}`
}

/**
 * Computes the upload tasks (the main file, optionally cropped, and every configured
 * image size) and hands each to the injected `transform` callback exactly once.
 *
 * Every task's bytes come from one staged Cloudinary original: it is uploaded once,
 * all derived versions are generated in a single call, and the original is removed
 * before returning. Reads the Cloudinary-owned config from
 * `cloudinaryTransformer({ collections })` at factory-construction time - not from the
 * sanitized collection, which only gets the narrowed projection `init()` writes back.
 */
export function createPrepareUpload({
  collections,
  config,
  uploadFolder,
}: {
  collections: Partial<Record<string, CloudinaryCollectionConfig>>
  config: ResolvedCloudinaryConfig
  uploadFolder: string
}): NonNullable<UploadTransformerInternal['prepareUpload']> {
  return async ({ collectionSlug, file, req, transform, uploadEdits }) => {
    const collectionUpload = collections[collectionSlug] ?? {}

    // Anything Cloudinary can't ingest still has to run the rest of the pipeline,
    // so hand the main file straight through rather than returning early.
    if (!canTransformImage(file.type)) {
      const passthrough = await transform({ fieldPath: 'filename', options: undefined })

      return [{ fieldPath: 'filename', file: passthrough, mimeType: passthrough.type }]
    }

    const original = await uploadOriginal({
      buffer: Buffer.from(await file.arrayBuffer()),
      config,
      folder: uploadFolder,
    })

    try {
      const focalPoint = resolveFocalPoint({ collectionUpload, uploadEdits })
      const cropData =
        uploadEdits && typeof uploadEdits === 'object' && 'crop' in uploadEdits
          ? uploadEdits.crop
          : undefined

      const mainChain = buildMainTransformationChain({
        crop:
          cropData && isNumber(uploadEdits.widthInPixels) && isNumber(uploadEdits.heightInPixels)
            ? {
                heightInPixels: uploadEdits.heightInPixels,
                originalDimensions: original,
                widthInPixels: uploadEdits.widthInPixels,
                x: percentToPixel(cropData.x, original.width),
                y: percentToPixel(cropData.y, original.height),
              }
            : undefined,
        formatOptions: collectionUpload.formatOptions,
        resizeOptions: collectionUpload.resizeOptions,
      })

      const tasks: PlannedTask[] = []
      const omittedSizes: PreparedUploadTransformation[] = []

      if (mainChain.length > 0) {
        tasks.push({ chain: mainChain, fieldPath: 'filename' })
      }

      for (const size of collectionUpload.imageSizes ?? []) {
        const sizeOptions = size as { name: string } & CloudinaryImageSizeOptions
        const fieldPath = `sizes.${sizeOptions.name}` as const

        if (getImageSizeAction({ dimensions: original, size: sizeOptions }) === 'omit') {
          omittedSizes.push({ fieldPath })
          continue
        }

        tasks.push({
          chain: [
            buildImageSizeTransformation({
              focalPoint,
              originalDimensions: original,
              size: sizeOptions,
            }),
          ],
          fieldPath,
        })
      }

      const derived = await generateDerivedAssets({
        chains: tasks.map((task) => task.chain),
        config,
        publicId: original.publicId,
      })

      const results: PreparedUploadTransformation[] = []
      let hasMainTask = false

      // Derived assets are fetched one task at a time: `transform` runs the whole
      // transformer pipeline, and running those concurrently would interleave stages.
      for (const [index, task] of tasks.entries()) {
        const asset = derived[index]!
        const options: CloudinaryUploadTaskOptions = {
          derivedURL: asset.url,
          fileExtension: asset.format,
          kind: task.fieldPath === 'filename' ? 'main' : 'size',
          mimeType: `image/${asset.format}`,
        }

        const resultFile = await transform({ fieldPath: task.fieldPath, options })

        if (task.fieldPath === 'filename') {
          hasMainTask = true
        }

        results.push({
          fieldPath: task.fieldPath,
          file: resultFile,
          height: asset.height,
          mimeType: resultFile.type,
          width: asset.width,
        })
      }

      // With no main transformation the file still has to traverse the pipeline so
      // later transformers get their turn, and so its dimensions are reported.
      if (!hasMainTask) {
        const passthrough = await transform({ fieldPath: 'filename', options: undefined })

        results.unshift({
          fieldPath: 'filename',
          file: passthrough,
          height: original.height,
          mimeType: passthrough.type,
          width: original.width,
        })
      }

      return [...results, ...omittedSizes]
    } finally {
      try {
        await deleteOriginal({ config, publicId: original.publicId })
      } catch (err) {
        req.payload.logger.error({
          err,
          msg: `Failed to remove the staged Cloudinary original "${original.publicId}".`,
        })
      }
    }
  }
}

function resolveFocalPoint({
  collectionUpload,
  uploadEdits,
}: {
  collectionUpload: CloudinaryCollectionConfig
  uploadEdits?: { focalPoint?: { x?: number; y?: number } }
}): FocalPoint | undefined {
  if (collectionUpload.focalPoint === false || !uploadEdits?.focalPoint) {
    return undefined
  }

  return {
    x: isNumber(uploadEdits.focalPoint.x) ? Math.round(uploadEdits.focalPoint.x) : 50,
    y: isNumber(uploadEdits.focalPoint.y) ? Math.round(uploadEdits.focalPoint.y) : 50,
  }
}
