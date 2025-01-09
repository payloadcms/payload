import httpStatus from 'http-status'
import { match } from 'path-to-regexp'

import type { Collection } from '../collections/config/types.js'
import type { Endpoint, PayloadHandler, SanitizedConfig } from '../config/types.js'
import type { GlobalConfig } from '../globals/config/types.js'
import type { PayloadRequest } from '../types/index.js'

import { createPayloadRequest } from './createPayloadRequest.js'
import { headersWithCors } from './headersWithCors.js'
import { routeError } from './routeError.js'

const notImplementedHandler: PayloadHandler = (req) => {
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

const notFoundHandler: PayloadHandler = (req) => {
  return Response.json(
    {
      message: `Route Not Found: "${new URL(req.url).pathname}"`,
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

export const handleEndpoints = async ({
  config: incomingConfig,
  onPayloadRequest,
  request,
}: {
  config: Promise<SanitizedConfig> | SanitizedConfig
  onPayloadRequest?: (req: PayloadRequest) => void
  request: Request
}) => {
  let handler: PayloadHandler
  let req: PayloadRequest
  let collection: Collection

  if (
    request.method.toLowerCase() === 'post' &&
    request.headers.get('X-HTTP-Method-Override') === 'GET'
  ) {
    const response = await handleEndpoints({
      config: incomingConfig,
      onPayloadRequest,
      request: new Request(request.url, {
        ...request,
        body: null,
        method: 'GET',
      }),
    })

    return response
  }

  try {
    req = await createPayloadRequest({ config: incomingConfig, request })

    if (typeof onPayloadRequest === 'function') {
      onPayloadRequest(req)
    }

    const { payload } = req
    const { config } = payload

    const pathname = new URL(req.url).pathname

    if (!pathname.startsWith(config.routes.api)) {
      return null
    }

    // convert /api/something to /something
    let adjustedPathname = pathname.replace(config.routes.api, '')

    if (adjustedPathname.startsWith('/globals')) {
      adjustedPathname = adjustedPathname.replace('/globals', '')
    }

    const segments = adjustedPathname.split('/')
    segments.shift()
    const firstParam = segments[0]

    let globalConfig: GlobalConfig

    if (firstParam) {
      if (payload.collections[firstParam]) {
        collection = payload.collections[firstParam]
      }

      if (firstParam === 'globals') {
        const secondParam = segments[1]

        const foundGlobal = payload.globals.config.find((each) => each.slug === secondParam)

        if (foundGlobal) {
          globalConfig = foundGlobal
        }
      }
    }

    let endpoints: Endpoint[] | false = config.endpoints

    if (collection) {
      endpoints = collection.config.endpoints
      // convert /posts/something to /something
      adjustedPathname = adjustedPathname.replace(`/${collection.config.slug}`, '')
    } else if (globalConfig) {
      adjustedPathname = adjustedPathname.replace(`/${globalConfig.slug}`, '')
      endpoints = globalConfig.endpoints
    }

    if (adjustedPathname === '') {
      adjustedPathname = '/'
    }

    if (endpoints === false) {
      handler = notImplementedHandler
    }

    if (endpoints) {
      const endpoint = endpoints.find((endpoint) => {
        if (endpoint.method !== req.method.toLowerCase()) {
          return false
        }
        const pathMatchFn = match(endpoint.path, { decode: decodeURIComponent })

        const matchResult = pathMatchFn(adjustedPathname)

        if (!matchResult) {
          return false
        }

        req.routeParams = matchResult.params as Record<string, unknown>

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
    }

    if (!handler) {
      handler = notFoundHandler
    }

    const response = await handler(req)

    if (req.responseHeaders) {
      for (const [key, value] of req.responseHeaders) {
        response.headers.append(key, value)
      }
    }

    return response
  } catch (err) {
    return routeError({
      collection,
      config: incomingConfig,
      err,
      req,
    })
  }
}
