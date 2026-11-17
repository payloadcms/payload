import type { ImageSize, PayloadRequest } from 'payload'
import type { UploadTransformation, UploadTransformerInternal } from 'payload/internal'

import type {
  CloudflareCollectionConfig,
  CloudflareImageSizeOptions,
  CloudflareUploadTask,
  ImagesClient,
} from './types.js'

import { resolveResize } from './transformation.js'

/**
 * Creates the bridge's `transformUpload`: plans the main file and each persisted variant, and runs
 * each one through core's stage pipeline. `transformFile` applies the saved crop and focal point
 * from `doc._transforms`.
 */
export function createTransformUpload({
  slug,
  client,
  collections,
}: {
  client: ImagesClient
  collections: Partial<Record<string, CloudflareCollectionConfig>>
  slug: string
}): NonNullable<UploadTransformerInternal['transformUpload']> {
  return async ({ collectionSlug, cropSize, file, req, transform }) => {
    const options = collections[collectionSlug] ?? {}
    const mainFile = await transform({
      fieldPath: 'filename',
      options: {
        cropSize,
        formatOptions: options.formatOptions,
        kind: 'main',
        transformerSlug: slug,
        transforms: options.resizeOptions
          ? [resolveResize({ options: options.resizeOptions })]
          : [],
      } satisfies CloudflareUploadTask,
    })
    const results: UploadTransformation[] = [
      await describeResult({
        client,
        fieldPath: 'filename',
        file: mainFile,
        req,
      }),
    ]

    if (!options.variants?.length) {
      return results
    }
    // Derive every variant from the cropped/resized main result, including any
    // changes made by another eligible stage, rather than the discarded original.
    const sourceDimensions = results[0]!

    if (!sourceDimensions.width || !sourceDimensions.height) {
      throw new Error('Cloudflare variants require raster image dimensions.')
    }

    const isFocalPointEnabled =
      (options.focalPoint ?? req.payload.collections[collectionSlug]?.config.upload?.focalPoint) !==
      false

    for (const rawSize of options.variants) {
      const size = rawSize as CloudflareImageSizeOptions & ImageSize
      const fieldPath = `variants.${size.name}` as const
      const isTooSmall =
        size.width && size.height
          ? sourceDimensions.width < size.width && sourceDimensions.height < size.height
          : size.width
            ? sourceDimensions.width < size.width
            : size.height
              ? sourceDimensions.height < size.height
              : false

      if (size.withoutEnlargement === undefined && isTooSmall) {
        results.push({ fieldPath })
        continue
      }
      const resize = resolveResize({
        options: {
          fit: size.fit,
          gravity: size.gravity,
          height: size.height,
          width: size.width,
          withoutEnlargement: size.withoutEnlargement,
        },
      })

      const canUseFocalPoint = Boolean(
        isFocalPointEnabled &&
        !size.gravity &&
        size.width &&
        size.height &&
        ['cover', 'crop'].includes(resize.fit!),
      )
      const resultFile = await transform({
        fieldPath,
        file: mainFile,
        options: {
          canUseFocalPoint,
          formatOptions: size.formatOptions ?? options.formatOptions,
          kind: 'variant',
          transformerSlug: slug,
          transforms: [resize],
        } satisfies CloudflareUploadTask,
      })
      const result = await describeResult({
        client,
        fieldPath,
        file: resultFile,
        req,
      })
      const extension =
        resultFile.type.slice('image/'.length) === 'jpeg'
          ? 'jpg'
          : resultFile.type.slice('image/'.length)
      const originalName = file.name.replace(/\.[^.]+$/, '')
      const name =
        size.generateImageName && result.width && result.height
          ? size.generateImageName({
              extension,
              height: result.height,
              originalName,
              sizeName: size.name,
              width: result.width,
            })
          : `${originalName}-${size.name}.${extension}`

      result.file = new File([resultFile], name, {
        type: resultFile.type,
        lastModified: resultFile.lastModified,
      })
      results.push(result)
    }

    return results
  }
}

async function describeResult({
  client,
  fieldPath,
  file,
  req,
}: {
  client: ImagesClient
  fieldPath: UploadTransformation['fieldPath']
  file: File
  req: PayloadRequest
}): Promise<UploadTransformation> {
  const dimensions = await client.info({ file, req })

  return {
    fieldPath,
    file,
    height: 'height' in dimensions ? dimensions.height : undefined,
    mimeType: file.type,
    width: 'width' in dimensions ? dimensions.width : undefined,
  }
}
