import type { PayloadHandler, PayloadRequest } from 'payload'

import {
  createMcpHandler,
  isLegacyRequest,
  readRequestBody,
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
  if (new URL(req.url).searchParams.has('overrideAccess')) {
    throw new APIError(
      'MCP overrideAccess is not supported. Authenticate with Payload instead.',
      400,
    )
  }

  const authorizedMCP = await getAuthorizedMCP({ req })
  const maxRequestBodySize = pluginConfig.mcp?.maxRequestBodySize
  // Payload augments the original web-standard Request in place.
  const mcpRequest = req as PayloadRequest & Request
  const parsedBody = await parseRequestBody({ maxRequestBodySize, request: mcpRequest })

  // Keep the old JSON-only, stateless behavior because the SDK's 2025 fallback uses SSE.
  if (await isLegacyRequest(mcpRequest, parsedBody, { maxRequestBodySize })) {
    const server = buildMcpServer({ authorizedMCP, pluginConfig, req })
    const transport = new WebStandardStreamableHTTPServerTransport({
      enableJsonResponse: true,
      maxRequestBodySize,
      sessionIdGenerator: undefined, // stateless mode
    })
    transport.onerror = (err) => {
      req.payload.logger.error({ err, msg: 'Error serving legacy MCP request' })
    }

    try {
      await server.connect(transport)
      return await transport.handleRequest(mcpRequest, { parsedBody })
    } finally {
      await server.close().catch((err) => {
        req.payload.logger.error({ err, msg: 'Error closing MCP server' })
      })
    }
  }

  const handler = createMcpHandler(() => buildMcpServer({ authorizedMCP, pluginConfig, req }), {
    legacy: 'reject',
    maxRequestBodySize,
    // SDK subscriptions always use SSE, so disable them to keep every response JSON-only.
    maxSubscriptions: 0,
    onerror: (err) => {
      req.payload.logger.error({ err, msg: 'Error serving modern MCP request' })
    },
    responseMode: 'json',
  })

  try {
    return await handler.fetch(mcpRequest, { parsedBody })
  } finally {
    await handler.close().catch((err) => {
      req.payload.logger.error({ err, msg: 'Error closing modern MCP handler' })
    })
  }
}

/**
 * Parses a POST body once so the era check and the SDK handler can share it. The SDK
 * skips its size limit for a pre-parsed body, so this reads with the same limit. It reads
 * a clone and returns `undefined` for any body the SDK should reject (too large, unreadable,
 * or not JSON), leaving the original request for the SDK to read and answer.
 */
const parseRequestBody = async ({
  maxRequestBodySize,
  request,
}: {
  maxRequestBodySize?: number
  request: Request
}): Promise<unknown> => {
  if (request.method.toUpperCase() !== 'POST') {
    return undefined
  }

  try {
    const body = await readRequestBody(request.clone(), maxRequestBodySize)
    return body.tooLarge ? undefined : JSON.parse(body.text)
  } catch {
    return undefined
  }
}
