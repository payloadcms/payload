import type { HandleTransformRequestArgs, HandleTransformRequestResult } from 'payload'

import type {
  CloudinaryDeliveryMode,
  CloudinaryDynamicDefaults,
  ResolvedCloudinaryConfig,
  ResolveSourceURL,
} from './types.js'

import { buildFetchURL } from './buildFetchURL.js'
import { buildDynamicTransformation } from './buildTransformation.js'
import { parseDynamicTransform } from './parseDynamicTransform.js'

type ResolvedDynamicDefaults = {
  format?: CloudinaryDynamicDefaults['format']
} & Required<Omit<CloudinaryDynamicDefaults, 'format'>>

/**
 * Builds the request-time `handleRequest` stage: parses and validates the dynamic
 * parameters, resolves the publicly reachable source URL, and hands the work to
 * Cloudinary's fetch delivery.
 *
 * `getSourceFile` is deliberately never called - Cloudinary pulls the source itself,
 * so reading the stored bytes through Payload would be pure waste. That also leaves
 * the single-use source handle available to any later transformer in the pipeline.
 */
export function createHandleRequest({
  config,
  delivery,
  dynamicDefaults,
  resolveSourceURL,
}: {
  config: ResolvedCloudinaryConfig
  delivery: CloudinaryDeliveryMode
  dynamicDefaults: ResolvedDynamicDefaults
  resolveSourceURL: ResolveSourceURL
}): (args: HandleTransformRequestArgs) => Promise<HandleTransformRequestResult> {
  return async ({ collectionSlug, documentID, filename, req }) => {
    const parseResult = parseDynamicTransform({
      limits: dynamicDefaults,
      searchParams: req.searchParams ?? new URLSearchParams(),
    })

    if (!parseResult.isRouted) {
      return { status: 'continue' }
    }

    if (!parseResult.valid) {
      return {
        response: Response.json({ errors: [{ message: parseResult.error }] }, { status: 400 }),
        status: 'complete',
      }
    }

    if (req.headers?.get('range')) {
      return { response: new Response(null, { status: 416 }), status: 'complete' }
    }

    const sourceURL = await resolveSourceURL({ collectionSlug, documentID, filename, req })

    const deliveryURL = buildFetchURL({
      config,
      sourceURL,
      transformation: buildDynamicTransformation({
        defaults: dynamicDefaults,
        height: parseResult.height,
        width: parseResult.width,
        withoutEnlargement: parseResult.withoutEnlargement,
      }),
    })

    if (delivery === 'redirect') {
      return { response: Response.redirect(deliveryURL, 302), status: 'complete' }
    }

    const transformed = await fetch(deliveryURL, {
      method: req.method === 'HEAD' ? 'HEAD' : 'GET',
      signal: req.signal,
    })

    if (!transformed.ok) {
      return {
        response: new Response(null, {
          status: transformed.status,
          statusText: transformed.statusText,
        }),
        status: 'complete',
      }
    }

    const headers = new Headers()
    const contentType = transformed.headers.get('content-type')
    const contentLength = transformed.headers.get('content-length')

    if (contentType) {
      headers.set('Content-Type', contentType)
    }
    if (contentLength) {
      headers.set('Content-Length', contentLength)
    }

    return {
      response: new Response(req.method === 'HEAD' ? null : transformed.body, {
        headers,
        status: 200,
      }),
      status: 'continue',
    }
  }
}
