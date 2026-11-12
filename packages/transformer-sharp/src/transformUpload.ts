import type { ProbedImageSize } from 'payload'
import type { UploadTransformation, UploadTransformerInternal } from 'payload/internal'

import type { SharpCollectionConfig, SharpDependency, SharpUploadTaskOptions } from './types.js'

import { canResizeImage } from './canResizeImage.js'
import { createSharpFromFile } from './createSharpFromFile.js'
import { getImageResizeAction } from './getImageResizeAction.js'
import { mapWithBoundedConcurrency } from './mapWithBoundedConcurrency.js'
import { sanitizeResizeConfig } from './sanitizeResizeConfig.js'

/**
 * Sharp throws on truncated/header-only files. Returns `undefined` instead —
 * matching core's dependency-free probe — since unreadable dimensions shouldn't fail the upload.
 */
async function tryProbe(file: File, sharpDependency: SharpDependency) {
  try {
    const sharpFile = await createSharpFromFile({ file, sharpDependency })
    const metadata = await sharpFile.metadata()
    return metadata.width && metadata.height ? metadata : undefined
  } catch {
    return undefined
  }
}

/**
 * Creates the Sharp bridge's `transformUpload`. When core calls it, it plans the upload tasks (the
 * main file, optionally cropped, and every configured image size), runs each one through the
 * injected `transform` callback exactly once, and reads the size of each result. Reads the
 * Sharp-owned config from `sharpTransformer({ collections })` at factory-construction time — not
 * from the sanitized collection, which only gets the narrowed projection `init()` writes back.
 */
export function createTransformUpload({
  collections,
  sharpDependency,
}: {
  collections: Partial<Record<string, SharpCollectionConfig>>
  sharpDependency: SharpDependency
}): NonNullable<UploadTransformerInternal['transformUpload']> {
  return async ({ collectionSlug, cropSize, file, req, transform }) => {
    const collectionUpload = collections[collectionSlug] ?? {}

    const fileSupportsResize = canResizeImage(file.type)

    let originalDimensions: ProbedImageSize | undefined

    if (fileSupportsResize) {
      const originalMeta = await tryProbe(file, sharpDependency)
      if (originalMeta) {
        originalDimensions = { height: originalMeta.height, width: originalMeta.width }
      }
    }

    // Unreadable dimensions can't be cropped/resized — treat as non-resizable rather than failing the upload.
    const canProcessAsImage = fileSupportsResize && originalDimensions !== undefined

    // `transformFile` reads the crop from `doc._transforms`. It needs the original's size for it.
    const mainResultFile = await transform({
      fieldPath: 'filename',
      options: {
        collectionUpload,
        cropSize,
        kind: 'main',
        originalDimensions,
      } satisfies SharpUploadTaskOptions,
    })

    const mainResult = await describeResult({
      fieldPath: 'filename',
      fileSupportsResize: canProcessAsImage,
      resultFile: mainResultFile,
      sharpDependency,
    })

    const results: UploadTransformation[] = [mainResult]

    // Same precedence `init()` applies: Sharp's setting, else the collection's own `focalPoint`.
    const effectiveFocalPoint =
      collectionUpload.focalPoint ??
      req.payload.collections[collectionSlug]?.config.upload?.focalPoint
    const focalPointEnabled = effectiveFocalPoint !== false
    const variants = collectionUpload.variants

    if (canProcessAsImage && Array.isArray(variants) && originalDimensions) {
      const sizeResults = await mapWithBoundedConcurrency(variants, async (rawConfig) => {
        const imageResizeConfig = sanitizeResizeConfig(rawConfig)
        const fieldPath = `variants.${imageResizeConfig.name}` as const

        const resizeAction = getImageResizeAction({
          dimensions: originalDimensions,
          // Whether a size may use a focal point. `transformFile` uses one only when it is saved.
          hasFocalPoint: focalPointEnabled,
          imageResizeConfig,
        })

        if (resizeAction === 'omit') {
          return { fieldPath } satisfies UploadTransformation
        }

        const sizeResultFile = await transform({
          fieldPath,
          options: {
            canUseFocalPoint: resizeAction === 'resizeWithFocalPoint',
            collectionUpload,
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
  fieldPath: UploadTransformation['fieldPath']
  fileSupportsResize: boolean
  resultFile: File
  sharpDependency: SharpDependency
}): Promise<UploadTransformation> {
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
