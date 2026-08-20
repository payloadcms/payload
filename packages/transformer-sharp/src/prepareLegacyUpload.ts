import type { FocalPoint, ProbedImageSize } from 'payload'
import type { PreparedUploadTransformation, UploadTransformerInternal } from 'payload/internal'

import { isNumber } from 'payload/shared'

import type { SharpCollectionConfig, SharpDependency, SharpUploadTaskOptions } from './types.js'

import { canResizeImage } from './canResizeImage.js'
import { getImageResizeAction } from './getImageResizeAction.js'
import { mapWithBoundedConcurrency } from './mapWithBoundedConcurrency.js'
import { sanitizeResizeConfig } from './sanitizeResizeConfig.js'

/**
 * Sharp throws on truncated/header-only files. Returns `undefined` instead —
 * matching core's dependency-free probe — since unreadable dimensions shouldn't fail the upload.
 */
async function tryProbe(file: File, sharpDependency: SharpDependency) {
  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const metadata = await sharpDependency(buffer).metadata()
    return metadata.width && metadata.height ? metadata : undefined
  } catch {
    return undefined
  }
}

/**
 * Computes the legacy upload tasks (the main file, optionally cropped, and every
 * configured legacy image size) and hands each to the injected `transform` callback
 * exactly once. Reads the Sharp-owned config from `sharpTransformer({ collections })`
 * at factory-construction time — not from the sanitized collection, which only gets
 * the narrowed projection `init()` writes back.
 */
export function createPrepareLegacyUpload({
  collections,
  sharpDependency,
}: {
  collections: Partial<Record<string, SharpCollectionConfig>>
  sharpDependency: SharpDependency
}): NonNullable<UploadTransformerInternal['prepareUpload']> {
  return async ({ collectionSlug, file, transform, uploadEdits }) => {
    const collectionUpload = collections[collectionSlug] ?? {}

    const fileSupportsResize = canResizeImage(file.type)

    const cropData =
      uploadEdits && typeof uploadEdits === 'object' && 'crop' in uploadEdits
        ? uploadEdits.crop
        : undefined

    let originalDimensions: ProbedImageSize | undefined

    if (fileSupportsResize) {
      const originalMeta = await tryProbe(file, sharpDependency)
      if (originalMeta) {
        originalDimensions = { height: originalMeta.height!, width: originalMeta.width! }
      }
    }

    // Unreadable dimensions can't be cropped/resized — treat as non-resizable rather than failing the upload.
    const canProcessAsImage = fileSupportsResize && originalDimensions !== undefined

    const mainResultFile = await transform({
      fieldPath: 'filename',
      options: {
        collectionUpload,
        crop:
          cropData && originalDimensions
            ? {
                cropData,
                heightInPixels: uploadEdits.heightInPixels!,
                originalDimensions,
                widthInPixels: uploadEdits.widthInPixels!,
              }
            : undefined,
        kind: 'main',
      } satisfies SharpUploadTaskOptions,
    })

    const results: PreparedUploadTransformation[] = [
      await describeResult({
        fieldPath: 'filename',
        fileSupportsResize: canProcessAsImage,
        resultFile: mainResultFile,
        sharpDependency,
      }),
    ]

    const focalPointEnabled = collectionUpload.focalPoint !== false
    const imageSizes = collectionUpload.imageSizes

    if (canProcessAsImage && Array.isArray(imageSizes) && originalDimensions) {
      const focalPoint: FocalPoint | undefined =
        focalPointEnabled && uploadEdits?.focalPoint
          ? {
              x: isNumber(uploadEdits.focalPoint.x) ? Math.round(uploadEdits.focalPoint.x) : 50,
              y: isNumber(uploadEdits.focalPoint.y) ? Math.round(uploadEdits.focalPoint.y) : 50,
            }
          : undefined

      const sizeResults = await mapWithBoundedConcurrency(imageSizes, async (rawConfig) => {
        const imageResizeConfig = sanitizeResizeConfig(rawConfig)
        const fieldPath = `sizes.${imageResizeConfig.name}` as const

        const resizeAction = getImageResizeAction({
          dimensions: originalDimensions,
          hasFocalPoint: Boolean(focalPoint),
          imageResizeConfig,
        })

        if (resizeAction === 'omit') {
          return { fieldPath } satisfies PreparedUploadTransformation
        }

        const sizeResultFile = await transform({
          fieldPath,
          options: {
            collectionUpload,
            focalPoint: resizeAction === 'resizeWithFocalPoint' ? focalPoint : undefined,
            imageResizeConfig,
            kind: 'size',
            originalDimensions,
          } satisfies SharpUploadTaskOptions,
        })

        return describeResult({
          fieldPath,
          fileSupportsResize: true,
          resultFile: sizeResultFile,
          sharpDependency,
        })
      })

      results.push(...sizeResults)
    }

    return results
  }
}

async function describeResult({
  fieldPath,
  fileSupportsResize,
  resultFile,
  sharpDependency,
}: {
  fieldPath: PreparedUploadTransformation['fieldPath']
  fileSupportsResize: boolean
  resultFile: File
  sharpDependency: SharpDependency
}): Promise<PreparedUploadTransformation> {
  if (!fileSupportsResize) {
    return { fieldPath, file: resultFile, mimeType: resultFile.type }
  }

  const meta = await tryProbe(resultFile, sharpDependency)

  if (!meta) {
    return { fieldPath, file: resultFile, mimeType: resultFile.type }
  }

  // `tryProbe` never sets `animated: true`, so `meta.height` is already the
  // single-frame height — do not divide by page count here.
  return {
    fieldPath,
    file: resultFile,
    height: meta.height,
    mimeType: resultFile.type,
    width: meta.width,
  }
}
