import type { SanitizedConfig } from 'payload'

import { createRequire } from 'module'

import { createPayloadRequest } from '../../utilities/createPayloadRequest.js'

const require = createRequire(import.meta.url)

let renderPlaygroundPage
const getRenderPlaygroundPage = () => {
  if (renderPlaygroundPage) {
    return renderPlaygroundPage
  } else {
    renderPlaygroundPage = require('graphql-playground-html').renderPlaygroundPage
    return renderPlaygroundPage
  }
}
export const GET = (config: Promise<SanitizedConfig>) => async (request: Request) => {
  const req = await createPayloadRequest({
    config,
    request,
  })

  const renderPlaygroundPage = getRenderPlaygroundPage()

  if (
    (!req.payload.config.graphQL.disable &&
      !req.payload.config.graphQL.disablePlaygroundInProduction &&
      process.env.NODE_ENV === 'production') ||
    process.env.NODE_ENV !== 'production'
  ) {
    return new Response(
      renderPlaygroundPage({
        endpoint: `${req.payload.config.routes.api}${req.payload.config.routes.graphQL}`,
        settings: {
          'request.credentials': 'include',
        },
      }),
      {
        headers: {
          'Content-Type': 'text/html',
        },
        status: 200,
      },
    )
  } else {
    return new Response('Route Not Found', { status: 404 })
  }
}
