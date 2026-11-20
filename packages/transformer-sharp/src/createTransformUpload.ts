import type { ProbedImageSize } from 'payload'
import type { UploadTransformation, UploadTransformerInternal } from 'payload/internal'

import { ValidationError } from 'payload'

import type { SharpCollectionConfig, SharpDependency, SharpUploadTaskOptions } from './types.js'

import { canResizeImage } from './canResizeImage.js'
import { createSharpFromFile } from './createSharpFromFile.js'
import { getImageResizeAction } from './getImageResizeAction.js'
import { mapWithBoundedConcurrency } from './mapWithBoundedConcurrency.js'
import { sanitizeResizeConfig } from './sanitizeResizeConfig.js'

/**
 * Sharp throws on truncated/header-only files. Returns `undefined` instead —
 * matching core's dependency-free probe — since unreadable dimensions shouldn't fail the upload.
 *
 * The probe deliberately runs with `limitInputPixels: false`: Sharp enforces
 * that limit even on `metadata()`, and omitting the option only leaves
 * Sharp's own 268M default in force, so a capped probe could not read the
 * dimensions an over-cap source is refused for. `metadata()` only reads the
 * header, so the uncapped probe is cheap; the caller refuses from the
 * dimensions it returns, and every decode constructor still carries the cap.
 */
async function tryProbe({
  file,
  sharpDependency,
}: {
  file: File
  sharpDependency: SharpDependency
}) {
  try {
    const sharpFile = await createSharpFromFile({
      file,
      options: { limitInputPixels: false },
      sharpDependency,
    })
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
  maxInputPixels: globalMaxInputPixels,
  sharpDependency,
}: {
  collections: Partial<Record<string, SharpCollectionConfig>>
  maxInputPixels: number
  sharpDependency: SharpDependency
}): NonNullable<UploadTransformerInternal['transformUpload']> {
  return async function transformUpload({ collectionSlug, cropSize, file, req, transform }) {
    // The collection's own cap wins over the transformer's global one.
    const maxInputPixels = collections[collectionSlug]?.maxInputPixels ?? globalMaxInputPixels
    const collectionUpload: SharpCollectionConfig = {
      ...collections[collectionSlug],
      maxInputPixels,
    }

    const fileSupportsResize = canResizeImage(file.type)

    let originalDimensions: ProbedImageSize | undefined

    if (fileSupportsResize) {
      const originalMeta = await tryProbe({ file, sharpDependency })
      if (originalMeta) {
        // `metadata()` reads the header only, so the pixel count is known before
        // any pixel is decoded. Refuse a decompression bomb here, with a 400,
        // rather than letting Sharp decode gigabytes and fail later.
        // Animated sources decode every frame, so the budget counts them all.
        const frameCount = originalMeta.pages ?? 1
        const sourcePixels = originalMeta.width * originalMeta.height * frameCount
        if (sourcePixels > maxInputPixels) {
          const frameDescription = frameCount > 1 ? ` across ${frameCount} frames` : ''
          throw new ValidationError({
            errors: [
              {
                message: `Uploaded image is ${originalMeta.width}x${originalMeta.height}${frameDescription} (${sourcePixels} pixels), which exceeds the maximum input size of ${maxInputPixels} pixels.`,
                path: 'file',
              },
            ],
          })
        }

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

  const meta = await tryProbe({ file: resultFile, sharpDependency })

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
