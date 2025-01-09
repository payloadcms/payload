import httpStatus from 'http-status'
import { match } from 'path-to-regexp'

import type { Collection } from '../collections/config/types.js'
import type { Endpoint, PayloadHandler, SanitizedConfig } from '../config/types.js'
import type { GlobalConfig } from '../globals/config/types.js'
import type { PayloadRequest } from '../types/index.js'

import { createPayloadRequest } from './createPayloadRequest.js'
import { headersWithCors } from './headersWithCors.js'
import { routeError } from './routeError.js'

export const handleEndpoints = async ({
  config: incomingConfig,
  request,
}: {
  config: Promise<SanitizedConfig> | SanitizedConfig
  request: Request
}): Promise<Response> => {
  let handler: PayloadHandler
  let req: PayloadRequest
  let collection: Collection

  if (
    request.method.toLowerCase() === 'post' &&
    request.headers.get('X-HTTP-Method-Override') === 'GET'
  ) {
    const search = await request.text()

    const url = `${request.url}?${new URLSearchParams(search).toString()}`
    const response = await handleEndpoints({
      config: incomingConfig,
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

    const pathname = new URL(req.url).pathname

    if (!pathname.startsWith(config.routes.api)) {
      return null
    }

    // convert /api/something to /something
    let adjustedPathname = pathname.replace(config.routes.api, '')

    let isGlobals = false
    if (adjustedPathname.startsWith('/globals')) {
      isGlobals = true
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
    }

    if (isGlobals) {
      const secondParam = segments[0]

      globalConfig = payload.globals.config.find((each) => each.slug === secondParam)
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
