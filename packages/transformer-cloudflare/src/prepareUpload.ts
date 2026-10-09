import type { ImageSize, PayloadRequest } from 'payload'
import type { PreparedUploadTransformation, UploadTransformerInternal } from 'payload/internal'

import type {
  CloudflareCollectionConfig,
  CloudflareImageSizeOptions,
  CloudflareTransformation,
  CloudflareUploadTask,
  ImagesClient,
} from './types.js'

import { resolveResize } from './transformation.js'

/** Plans the main file and persisted variants through Payload's existing pipeline. */
export function createPrepareUpload({
  slug,
  client,
  collections,
}: {
  client: ImagesClient
  collections: Partial<Record<string, CloudflareCollectionConfig>>
  slug: string
}): NonNullable<UploadTransformerInternal['prepareUpload']> {
  return async ({ collectionSlug, file, req, transform, uploadEdits }) => {
    const options = collections[collectionSlug] ?? {}
    const needsDimensions = Boolean(uploadEdits?.crop)
    const dimensions = needsDimensions ? await client.info({ file, req }) : undefined
    const mainTransforms: CloudflareTransformation[] = []
    const crop = uploadEdits?.crop

    if (crop && dimensions && 'width' in dimensions) {
      const width = uploadEdits.widthInPixels
      const height = uploadEdits.heightInPixels
      const left = Math.floor(crop.unit === 'px' ? crop.x : (crop.x / 100) * dimensions.width)
      const top = Math.floor(crop.unit === 'px' ? crop.y : (crop.y / 100) * dimensions.height)

      if (
        !width ||
        !height ||
        !Number.isSafeInteger(width) ||
        !Number.isSafeInteger(height) ||
        width < 1 ||
        height < 1 ||
        !Number.isFinite(left) ||
        !Number.isFinite(top) ||
        left < 0 ||
        top < 0 ||
        left + width > dimensions.width ||
        top + height > dimensions.height
      ) {
        throw new Error('Invalid Cloudflare crop rectangle.')
      }
      mainTransforms.push({
        trim: {
          bottom: dimensions.height - top - height,
          left,
          right: dimensions.width - left - width,
          top,
        },
      })
    }
    if (options.resizeOptions) {
      mainTransforms.push(resolveResize({ options: options.resizeOptions }))
    }
    const mainFile = await transform({
      fieldPath: 'filename',
      options: {
        formatOptions: options.formatOptions,
        transformerSlug: slug,
        transforms: mainTransforms,
      } satisfies CloudflareUploadTask,
    })
    const results: PreparedUploadTransformation[] = [
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

    const shouldUseFocalPoint =
      (options.focalPoint ?? req.payload.collections[collectionSlug]?.config.upload?.focalPoint) !==
      false
    const focalPoint = shouldUseFocalPoint ? uploadEdits?.focalPoint : undefined

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

      if (
        focalPoint &&
        !size.gravity &&
        size.width &&
        size.height &&
        ['cover', 'crop'].includes(resize.fit!)
      ) {
        const { x = 50, y = 50 } = focalPoint

        if (![x, y].every((value) => Number.isFinite(value) && value >= 0 && value <= 100)) {
          throw new Error('Cloudflare focal point must be between 0 and 100.')
        }
        resize.gravity = { mode: 'box-center', x: x / 100, y: y / 100 }
      }
      const resultFile = await transform({
        fieldPath,
        file: mainFile,
        options: {
          formatOptions: size.formatOptions ?? options.formatOptions,
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
  fieldPath: PreparedUploadTransformation['fieldPath']
  file: File
  req: PayloadRequest
}): Promise<PreparedUploadTransformation> {
  const dimensions = await client.info({ file, req })

  return {
    fieldPath,
    file,
    height: 'height' in dimensions ? dimensions.height : undefined,
    mimeType: file.type,
    width: 'width' in dimensions ? dimensions.width : undefined,
  }
}
