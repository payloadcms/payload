// @ts-strict-ignore
import { status as httpStatus } from 'http-status'
import { match } from 'path-to-regexp'

import type { Collection } from '../collections/config/types.js'
import type { Endpoint, PayloadHandler, SanitizedConfig } from '../config/types.js'
import type { GlobalConfig } from '../globals/config/types.js'
import type { PayloadRequest } from '../types/index.js'

import { createPayloadRequest } from './createPayloadRequest.js'
import { headersWithCors } from './headersWithCors.js'
import { mergeHeaders } from './mergeHeaders.js'
import { routeError } from './routeError.js'

const notFoundResponse = (req: PayloadRequest, pathname?: string) => {
  return Response.json(
    {
      message: `Route not found "${pathname ?? new URL(req.url).pathname}"`,
    },
    {
      headers: headersWithCors({
        headers: new Headers(),
        req,
      }),
      status: httpStatus.NOT_FOUND,
    },
  )
}

/**
 * Attaches the Payload REST API to any backend framework that uses Fetch Request/Response
 * like Next.js (app router), Remix, Bun, Hono.
 *
 * ### Example: Using Hono
 * ```ts
 * import { handleEndpoints } from 'payload';
 * import { serve } from '@hono/node-server';
 * import { loadEnv } from 'payload/node';
 *
 * const port = 3001;
 * loadEnv();
 *
 * const { default: config } = await import('@payload-config');
 *
 * const server = serve({
 *   fetch: async (request) => {
 *     const response = await handleEndpoints({
 *       config,
 *       request: request.clone(),
 *     });
 *
 *     return response;
 *   },
 *   port,
 * });
 *
 * server.on('listening', () => {
 *   console.log(`API server is listening on http://localhost:${port}/api`);
 * });
 * ```
 */
export const handleEndpoints = async ({
  basePath = '',
  config: incomingConfig,
  path,
  request,
}: {
  basePath?: string
  config: Promise<SanitizedConfig> | SanitizedConfig
  /** Override path from the request */
  path?: string
  request: Request
}): Promise<Response> => {
  let handler: PayloadHandler
  let req: PayloadRequest
  let collection: Collection

  // This can be used against GET request search params size limit.
  // Instead you can do POST request with a text body as search params.
  // We use this interally for relationships querying on the frontend
  // packages/ui/src/fields/Relationship/index.tsx
  if (
    request.method.toLowerCase() === 'post' &&
    request.headers.get('X-HTTP-Method-Override') === 'GET'
  ) {
    const search = await request.text()

    const url = `${request.url}?${new URLSearchParams(search).toString()}`
    const response = await handleEndpoints({
      basePath,
      config: incomingConfig,
      path,
      request: new Request(url, {
        cache: request.cache,
        credentials: request.credentials,
        headers: request.headers,
        method: 'GET',
        signal: request.signal,
      }),
    })

    return response
  }

  try {
    req = await createPayloadRequest({ config: incomingConfig, request })

    if (req.method.toLowerCase() === 'options') {
      return Response.json(
        {},
        {
          headers: headersWithCors({
            headers: new Headers(),
            req,
          }),
          status: 200,
        },
      )
    }

    const { payload } = req
    const { config } = payload

    const pathname = `${basePath}${path ?? new URL(req.url).pathname}`

    if (!pathname.startsWith(config.routes.api)) {
      return notFoundResponse(req, pathname)
    }

    // /api/posts/route -> /posts/route
    let adjustedPathname = pathname.replace(config.routes.api, '')

    let isGlobals = false

    // /globals/header/route -> /header/route
    if (adjustedPathname.startsWith('/globals')) {
      isGlobals = true
      adjustedPathname = adjustedPathname.replace('/globals', '')
    }

    const segments = adjustedPathname.split('/')
    // remove empty string first element
    segments.shift()

    const firstParam = segments[0]

    let globalConfig: GlobalConfig

    // first param can be a global slug or collection slug, find the relevant config
    if (firstParam) {
      if (isGlobals) {
        globalConfig = payload.globals.config.find((each) => each.slug === firstParam)
      } else if (payload.collections[firstParam]) {
        collection = payload.collections[firstParam]
      }
    }

    let endpoints: Endpoint[] | false = config.endpoints

    if (collection) {
      endpoints = collection.config.endpoints
      // /posts/route -> /route
      adjustedPathname = adjustedPathname.replace(`/${collection.config.slug}`, '')
    } else if (globalConfig) {
      // /header/route -> /route
      adjustedPathname = adjustedPathname.replace(`/${globalConfig.slug}`, '')
      endpoints = globalConfig.endpoints
    }

    // sanitize when endpoint.path is '/'
    if (adjustedPathname === '') {
      adjustedPathname = '/'
    }

    if (endpoints === false) {
      return Response.json(
        {
          message: `Cannot ${req.method.toUpperCase()} ${req.url}`,
        },
        {
          headers: headersWithCors({
            headers: new Headers(),
            req,
          }),
          status: httpStatus.NOT_IMPLEMENTED,
        },
      )
    }

    // Find the relevant endpoint configuration
    const endpoint = endpoints?.find((endpoint) => {
      if (endpoint.method !== req.method.toLowerCase()) {
        return false
      }

      const pathMatchFn = match(endpoint.path, { decode: decodeURIComponent })

      const matchResult = pathMatchFn(adjustedPathname)

      if (!matchResult) {
        return false
      }

      req.routeParams = matchResult.params as Record<string, unknown>

      // Inject to routeParams the slug as well so it can be used later
      if (collection) {
        req.routeParams.collection = collection.config.slug
      } else if (globalConfig) {
        req.routeParams.global = globalConfig.slug
      }

      return true
    })

    if (endpoint) {
      handler = endpoint.handler
    }

    if (!handler) {
      return notFoundResponse(req, pathname)
    }

    const response = await handler(req)
    return new Response(response.body, {
      headers: mergeHeaders(req.responseHeaders ?? new Headers(), response.headers),
      status: response.status,
      statusText: response.statusText,
    })
  } catch (err) {
    return routeError({
      collection,
      config: incomingConfig,
      err,
      req,
    })
  }
}
