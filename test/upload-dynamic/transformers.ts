import type { UploadTransformer } from 'payload'

import { dynamicMediaSlug, publicCloudMediaSlug } from './shared.js'

const dynamicCollectionSlugs = [dynamicMediaSlug, publicCloudMediaSlug]

/**
 * Applies the saved crop when the file is requested, as a CDN transformer would, so the collection
 * stores only the original. A `w` query parameter adds a request-override stage.
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
  handleRequest: async ({ doc, getOriginalFile, options }) => {
    const original = await getOriginalFile()

    return {
      response: Response.json({
        crop: (doc._transforms as { crop?: unknown } | null)?.crop ?? null,
        originalSize: (await original.arrayBuffer()).byteLength,
        purpose: (options as { purpose: string }).purpose,
      }),
      status: 'continue',
    }
  },
  mimeTypes: ['image/*'],
}

/** Claims `crop` at upload time when a test sets `context.isUploadCropEnabled`. */
export const uploadCropTransformer: UploadTransformer = {
  slug: 'upload-crop',
  canTransform: ({ collectionSlug, operation, req }) =>
    collectionSlug === dynamicMediaSlug &&
    operation === 'upload' &&
    req.context?.isUploadCropEnabled === true
      ? { canTransform: true, handledTransformKeys: ['crop'] }
      : false,
  mimeTypes: ['image/*'],
  transformFile: () => ({ status: 'continue' }),
}
