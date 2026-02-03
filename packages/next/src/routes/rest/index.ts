import { handleEndpoints, type SanitizedConfig } from 'payload'
import { formatAdminURL } from 'payload/shared'

import { generateOGImage } from './og/index.js'

let initedOGEndpoint = false

const handlerBuilder =
  (config: Promise<SanitizedConfig> | SanitizedConfig) =>
  async (
    request: Request,
    args: {
      params: Promise<{ slug?: string[] }>
    },
  ): Promise<Response> => {
    const _log = (m: string) => console.log(`[next/rest] ${m}`)

    _log('handler start')
    const awaitedConfig = await config
    _log('config awaited')

    // Add this endpoint only when using Next.js, still can be overridden.
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

    const awaitedParams = await args.params

    _log('calling handleEndpoints')
    const response = await handleEndpoints({
      config,
      path: formatAdminURL({
        apiRoute: awaitedConfig.routes.api,
        path: awaitedParams ? `/${awaitedParams.slug.join('/')}` : undefined,
      }),
      request,
    })
    _log('handleEndpoints done')

    return response
  }

export const OPTIONS = handlerBuilder

export const GET = handlerBuilder

export const POST = handlerBuilder

export const DELETE = handlerBuilder

export const PATCH = handlerBuilder

export const PUT = handlerBuilder
