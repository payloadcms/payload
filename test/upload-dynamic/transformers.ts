import type { UploadTransformer } from 'payload'
import type { TransformerWithInternalBridge } from 'payload/internal'
import type { Sharp } from 'sharp'

import { registerUploadVariants } from 'payload'
import { uploadTransformerInternal } from 'payload/internal'
import sharp from 'sharp'

import { dynamicMediaSlug, publicCloudMediaSlug } from './shared.js'

const dynamicCollectionSlugs = [dynamicMediaSlug, publicCloudMediaSlug]

type Crop = { height: number; width: number; x: number; y: number }

/** Each `handleRequest` call of `requestCropTransformer`, so a test can check what it was given. */
export const requestCropCalls: { crop: Crop | null; purpose: string; variantName?: string }[] = []

const toImageResponse = async ({ image, mimeType }: { image: Sharp; mimeType: string }) =>
  new Response(new Uint8Array(await image.toBuffer()), { headers: { 'Content-Type': mimeType } })

/**
 * Applies the saved crop to the original when the file is requested, as a CDN transformer would,
 * so the collection stores only the original. A `w` query parameter adds a request-override stage
 * that resizes the cropped file.
 */
export const requestCropTransformer: UploadTransformer = {
  slug: 'request-crop',
  canTransform: ({ collectionSlug, operation, purpose, req }) => {
    if (!dynamicCollectionSlugs.includes(collectionSlug) || operation !== 'request') {
      return false
    }

    if (purpose === 'persisted-default') {
      return { canTransform: true, handledTransformKeys: ['crop'], options: { purpose } }
    }

    return req.searchParams?.has('w') ? { canTransform: true, options: { purpose } } : false
  },
  handleRequest: async ({
    doc,
    getOriginalFile,
    getSourceFile,
    mimeType,
    options,
    req,
    variantName,
  }) => {
    const { purpose } = options as { purpose: string }
    const crop = (doc._transforms as { crop?: Crop } | null)?.crop ?? null

    requestCropCalls.push({ crop, purpose, variantName })

    if (purpose === 'persisted-default') {
      const original = sharp(Buffer.from(await (await getOriginalFile()).arrayBuffer()))
      const cropped = crop
        ? original.extract({ height: crop.height, left: crop.x, top: crop.y, width: crop.width })
        : original

      return {
        response: await toImageResponse({
          image: variantName === 'card' ? cropped.resize({ width: 400 }) : cropped,
          mimeType,
        }),
        status: 'continue',
      }
    }

    const source = sharp(Buffer.from(await (await getSourceFile()).arrayBuffer()))

    return {
      response: await toImageResponse({
        image: source.resize({ width: Number(req.searchParams.get('w')) }),
        mimeType,
      }),
      status: 'continue',
    }
  },
  // Declares a `card` size, 400px wide, that is built on request, as a CDN transformer's size
  // presets would be.
  init: (config) =>
    registerUploadVariants({
      collections: { [dynamicMediaSlug]: { variants: [{ name: 'card' }] } },
      config,
      label: 'requestCropTransformer',
      transformerSlug: 'request-crop',
    }),
  mimeTypes: ['image/*'],
}

/** Applies the saved crop at upload time when a test sets `context.isUploadCropEnabled`. */
export const uploadCropTransformer: UploadTransformer = {
  slug: 'upload-crop',
  canTransform: ({ collectionSlug, operation, req }) =>
    collectionSlug === dynamicMediaSlug &&
    operation === 'upload' &&
    req.context?.isUploadCropEnabled === true
      ? { canTransform: true, handledTransformKeys: ['crop'] }
      : false,
  mimeTypes: ['image/*'],
  transformFile: async ({ doc, file }) => {
    const crop = (doc._transforms as { crop?: Crop } | null)?.crop

    if (!crop) {
      return { status: 'continue' }
    }

    const cropped = await sharp(Buffer.from(await file.arrayBuffer()))
      .extract({ height: crop.height, left: crop.x, top: crop.y, width: crop.width })
      .toBuffer()

    return {
      file: new File([new Uint8Array(cropped)], file.name, { type: file.type }),
      status: 'continue',
    }
  },
}

/**
 * A bridge like Sharp's that claims no keys, when a test sets `context.isUploadBridgeEnabled`. It is
 * planned for the upload, but does not run when the saved keys are applied at request time.
 */
export const uploadBridgeTransformer: TransformerWithInternalBridge & UploadTransformer = {
  slug: 'upload-bridge',
  canTransform: ({ collectionSlug, operation, req }) =>
    collectionSlug === dynamicMediaSlug &&
    operation === 'upload' &&
    req.context?.isUploadBridgeEnabled === true,
  init: (config) =>
    registerUploadVariants({
      collections: { [publicCloudMediaSlug]: { variants: [{ name: 'thumbnail' }] } },
      config,
      label: 'uploadBridgeTransformer',
      transformerSlug: 'upload-bridge',
    }),
  mimeTypes: ['image/*'],
  transformFile: () => Promise.resolve({ status: 'continue' }),
  [uploadTransformerInternal]: {
    prepareUpload: ({ file }) => Promise.resolve([{ fieldPath: 'filename', file }]),
  },
}
