import { v2 as cloudinary } from 'cloudinary'

import type { CloudinaryTransformation, ResolvedCloudinaryConfig } from './types.js'

import { toCloudinaryOptions } from './buildTransformation.js'

/**
 * Builds a Cloudinary `image/fetch` delivery URL: Cloudinary pulls `sourceURL` itself,
 * applies the transformation, and serves the result from its CDN. The source is never
 * read by Payload, so it must be reachable from the public internet and its host
 * allow-listed in your Cloudinary fetch settings.
 */
export function buildFetchURL({
  config,
  sourceURL,
  transformation,
}: {
  config: ResolvedCloudinaryConfig
  sourceURL: string
  transformation: CloudinaryTransformation
}): string {
  // `cloudinary.url` consumes keys off the options object, so it must receive a fresh copy.
  return cloudinary.url(sourceURL, {
    // Keep the SDK's analytics query param off URLs Payload serves or redirects to.
    analytics: false,
    ...config,
    ...toCloudinaryOptions(transformation),
    type: 'fetch',
    resource_type: 'image',
  })
}
