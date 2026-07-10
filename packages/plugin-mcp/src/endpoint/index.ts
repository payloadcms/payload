import type { PayloadHandler, PayloadRequest } from 'payload'

import {
  createMcpHandler,
  isLegacyRequest,
  WebStandardStreamableHTTPServerTransport,
} from '@modelcontextprotocol/server'
import { APIError } from 'payload'

import { buildMcpServer } from '../mcp/buildMcpServer.js'
import { getPluginConfig } from '../utils/getPluginConfig.js'
import { getAuthorizedMCP } from './access.js'

export const mcpEndpoint: PayloadHandler = async (req) => {
  if (!req.url) {
    throw new APIError('Missing request URL', 400)
  }

  req.payloadAPI = 'MCP' as const

  const pluginConfig = getPluginConfig({ config: req.payload.config })
  const overrideAccessParam = new URL(req.url).searchParams.get('overrideAccess')

  if (overrideAccessParam !== null && process.env.NODE_ENV !== 'development') {
    throw new APIError('MCP overrideAccess is only available in development.', 400)
  }

  let overrideAccess = false
  if (overrideAccessParam === 'true') {
    overrideAccess = true
  } else if (overrideAccessParam !== null && overrideAccessParam !== 'false') {
    throw new APIError('MCP overrideAccess must be "true" or "false".', 400)
  }

  const authorizedMCP = await getAuthorizedMCP({ overrideAccess, req })
  // Payload augments the original web-standard Request in place.
  const mcpRequest = req as PayloadRequest & Request

  // Keep the old JSON-only, stateless behavior because the SDK's 2025 fallback uses SSE.
  if (await isLegacyRequest(mcpRequest)) {
    const server = buildMcpServer({ authorizedMCP, pluginConfig, req })
    const transport = new WebStandardStreamableHTTPServerTransport({
      enableJsonResponse: true,
      sessionIdGenerator: undefined, // stateless mode
    })
    transport.onerror = (err) => {
      req.payload.logger.error({ err, msg: 'Error serving legacy MCP request' })
    }

    try {
      await server.connect(transport)
      return await transport.handleRequest(mcpRequest)
    } finally {
      await server.close().catch((err) => {
        req.payload.logger.error({ err, msg: 'Error closing MCP server' })
      })
    }
  }

  const handler = createMcpHandler(() => buildMcpServer({ authorizedMCP, pluginConfig, req }), {
    legacy: 'reject',
    // SDK subscriptions always use SSE, so disable them to keep every response JSON-only.
    maxSubscriptions: 0,
    onerror: (err) => {
      req.payload.logger.error({ err, msg: 'Error serving modern MCP request' })
    },
    responseMode: 'json',
  })

  try {
    return await handler.fetch(mcpRequest)
  } finally {
    await handler.close().catch((err) => {
      req.payload.logger.error({ err, msg: 'Error closing modern MCP handler' })
    })
  }
}
