import type { Document, PayloadRequest, TransformFileArgs, TransformFileResult } from 'payload'

import type {
  CloudflareCollectionConfig,
  CloudflareTransformation,
  CloudflareUploadTask,
  ImagesClient,
} from './types.js'

import { getSavedCrop, getSavedFocalPoint } from './readSavedTransforms.js'
import { resolveOutput, resolveResize } from './transformation.js'

/**
 * The Cloudflare package's one-file-in/one-file-out upload primitive. With a task from
 * `transformUpload`, it applies that task: the main file (cut by the crop saved in
 * `doc._transforms`), or one variant (centered on the saved focal point when the task allows it).
 * Without a task, it applies the collection's `resizeOptions` and `formatOptions`.
 */
export function createTransformFile({
  slug,
  client,
  collections,
}: {
  client: ImagesClient
  collections: Partial<Record<string, CloudflareCollectionConfig>>
  slug: string
}): (args: TransformFileArgs) => Promise<TransformFileResult> {
  return async ({ collectionSlug, doc, file, options, req }) => {
    if (options !== undefined && !isOwnTask({ slug, options })) {
      return { status: 'continue' }
    }

    const task = options as CloudflareUploadTask | undefined
    const config = collections[collectionSlug]
    const transforms = task
      ? await resolveTaskTransforms({ client, doc, file, req, task })
      : config?.resizeOptions
        ? [resolveResize({ options: config.resizeOptions })]
        : []
    const formatOptions = task ? task.formatOptions : config?.formatOptions

    if (!transforms.length && !formatOptions) {
      return { status: 'continue' }
    }

    const response = await client.transform({
      file,
      output: resolveOutput({ formatOptions, mimeType: file.type }),
      req,
      transforms,
    })
    const mimeType = response.headers.get('content-type')!
    const extension = mimeType === 'image/jpeg' ? 'jpg' : mimeType.slice(6)
    const name = `${file.name.replace(/\.[^.]+$/, '')}.${extension}`

    return {
      file: new File([await response.arrayBuffer()], name, {
        type: mimeType,
        lastModified: file.lastModified,
      }),
      status: 'continue',
    }
  }
}

function isOwnTask({ slug, options }: { options: unknown; slug: string }): boolean {
  return (
    Boolean(options) &&
    typeof options === 'object' &&
    'transformerSlug' in options! &&
    options.transformerSlug === slug
  )
}

async function resolveTaskTransforms({
  client,
  doc,
  file,
  req,
  task,
}: {
  client: ImagesClient
  doc: Document
  file: File
  req: PayloadRequest
  task: CloudflareUploadTask
}): Promise<CloudflareTransformation[]> {
  if (task.kind === 'variant') {
    const focalPoint = task.canUseFocalPoint ? getSavedFocalPoint({ doc }) : undefined

    return focalPoint
      ? [
          {
            ...task.transforms[0],
            gravity: { mode: 'box-center', x: focalPoint.x / 100, y: focalPoint.y / 100 },
          },
        ]
      : task.transforms
  }

  // A full-image selection saves no crop, but a request crop size still cuts from the corner.
  const crop =
    getSavedCrop({ doc }) ?? (task.cropSize ? { ...task.cropSize, x: 0, y: 0 } : undefined)

  if (!crop) {
    return task.transforms
  }

  const dimensions = await client.info({ file, req })

  if (!('width' in dimensions)) {
    return task.transforms
  }

  const trim = getCropTrim({ crop, cropSize: task.cropSize, dimensions })

  return trim ? [trim, ...task.transforms] : task.transforms
}

/**
 * Converts a pixel crop to a Cloudflare `trim`, or `undefined` when it keeps the whole image. A
 * request crop size replaces the saved size; a size larger than the saved crop moves the crop back
 * inside the image, as Sharp does.
 */
function getCropTrim({
  crop,
  cropSize,
  dimensions,
}: {
  crop: { height: number; width: number; x: number; y: number }
  cropSize?: { height: number; width: number }
  dimensions: { height: number; width: number }
}): CloudflareTransformation | undefined {
  const width = cropSize?.width ?? crop.width
  const height = cropSize?.height ?? crop.height

  if (width === dimensions.width && height === dimensions.height) {
    return undefined
  }

  const left = Math.floor(Math.min(crop.x, dimensions.width - width))
  const top = Math.floor(Math.min(crop.y, dimensions.height - height))

  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width < 1 ||
    height < 1 ||
    !Number.isFinite(left) ||
    !Number.isFinite(top) ||
    left < 0 ||
    top < 0
  ) {
    throw new Error('Invalid Cloudflare crop rectangle.')
  }

  return {
    trim: {
      bottom: dimensions.height - top - height,
      left,
      right: dimensions.width - left - width,
      top,
    },
  }
}
