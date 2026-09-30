import { v2 as cloudinary } from 'cloudinary'
import { randomUUID } from 'node:crypto'
import { Readable } from 'node:stream'

import type { CloudinaryTransformation, ResolvedCloudinaryConfig } from './types.js'

import { toCloudinaryOptions } from './buildTransformation.js'

export type UploadedOriginal = {
  height: number
  publicId: string
  width: number
}

export type DerivedAsset = {
  bytes: number
  format: string
  height: number
  url: string
  width: number
}

/**
 * Uploads the source image to a short-lived Cloudinary asset.
 *
 * Cloudinary has no stateless "transform these bytes" API - every transformation is
 * addressed against a stored asset - so upload-time processing has to stage the original
 * before it can pull derived versions back. The caller is responsible for calling
 * {@link deleteOriginal} once it has everything it needs.
 */
export async function uploadOriginal({
  buffer,
  config,
  folder,
}: {
  buffer: Buffer
  config: ResolvedCloudinaryConfig
  folder: string
}): Promise<UploadedOriginal> {
  const publicId = `${folder}/${randomUUID()}`

  const result = await new Promise<Record<string, unknown>>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        ...config,
        type: 'upload',
        overwrite: true,
        public_id: publicId,
        resource_type: 'image',
        unique_filename: false,
        use_filename: false,
      },
      (error, uploaded) => {
        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`))
          return
        }

        if (!uploaded) {
          reject(new Error('Cloudinary upload returned no result.'))
          return
        }

        resolve(uploaded as unknown as Record<string, unknown>)
      },
    )

    const source = Readable.from(buffer)

    source.on('error', (err: Error) => {
      uploadStream.destroy(err)
      reject(err)
    })

    source.pipe(uploadStream)
  })

  const height = Number(result.height)
  const width = Number(result.width)

  if (!Number.isFinite(height) || !Number.isFinite(width)) {
    throw new Error('Cloudinary upload returned no image dimensions.')
  }

  return { height, publicId, width }
}

/**
 * Generates every requested transformation of an already-staged original in one call,
 * returning each derived asset's URL alongside the dimensions Cloudinary actually
 * produced - so the resulting `sizes` metadata is reported, never predicted.
 */
export async function generateDerivedAssets({
  chains,
  config,
  publicId,
}: {
  chains: CloudinaryTransformation[][]
  config: ResolvedCloudinaryConfig
  publicId: string
}): Promise<DerivedAsset[]> {
  if (chains.length === 0) {
    return []
  }

  const result = (await cloudinary.uploader.explicit(publicId, {
    ...config,
    type: 'upload',
    eager: chains.map((chain) => ({ transformation: chain.map(toCloudinaryOptions) })),
    eager_async: false,
    resource_type: 'image',
  })) as unknown as { eager?: Record<string, unknown>[] }

  const eager = result.eager ?? []

  if (eager.length !== chains.length) {
    throw new Error(
      `Cloudinary returned ${eager.length} derived assets for ${chains.length} requested transformations.`,
    )
  }

  return eager.map((derived) => ({
    bytes: Number(derived.bytes),
    format: String(derived.format),
    height: Number(derived.height),
    url: String(derived.secure_url ?? derived.url),
    width: Number(derived.width),
  }))
}

/**
 * Removes the staged original. Failures are surfaced to the caller, which logs and
 * continues - an orphaned temporary asset must never fail an otherwise-good upload.
 */
export async function deleteOriginal({
  config,
  publicId,
}: {
  config: ResolvedCloudinaryConfig
  publicId: string
}): Promise<void> {
  await cloudinary.uploader.destroy(publicId, {
    ...config,
    type: 'upload',
    invalidate: true,
    resource_type: 'image',
  })
}
