import { handleEndpoints, type SanitizedConfig } from 'payload'

import { generateOGImage } from './og/index.js'

let initedOGEndpoint = false

const handlerBuilder =
  (config: Promise<SanitizedConfig> | SanitizedConfig) =>
  async (request: Request): Promise<Response> => {
    const awaitedConfig = await config

    // Add this endpoint only when using Next.js, still can be overriden.
    if (
      initedOGEndpoint === false &&
      !awaitedConfig.endpoints.some(
        (endpoint) => endpoint.path === '/og' && endpoint.method === 'get',
      )
    ) {
      awaitedConfig.endpoints.push({
        handler: generateOGImage,
        method: 'get',
        path: '/og',
      })
    }

    initedOGEndpoint = true

    const response = await handleEndpoints({
      basePath: process.env.NEXT_BASE_PATH,
      config,
      request,
    })

    return response
  }

export const OPTIONS = handlerBuilder

export const GET = handlerBuilder

export const POST = handlerBuilder

export const DELETE = handlerBuilder

export const PATCH = handlerBuilder

export const PUT = handlerBuilder
