import { handleEndpoints, type SanitizedConfig } from 'payload'

import { generateOGImage } from './og/index.js'

const handlerBuilder =
  (config: Promise<SanitizedConfig> | SanitizedConfig) =>
  async (request: Request): Promise<Response> => {
    const response = await handleEndpoints({
      config,
      // Add this endpoint only when using Next.js, still can be overriden.
      onPayloadRequest: (req) => {
        const { endpoints } = req.payload.config

        if (!endpoints.some((endpoint) => endpoint.path === '/og')) {
          endpoints.push({
            handler: generateOGImage,
            method: 'get',
            path: '/og',
          })
        }
      },
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
