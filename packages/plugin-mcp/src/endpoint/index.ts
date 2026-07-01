import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/server'
import { APIError, type PayloadHandler } from 'payload'

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

  const server = buildMcpServer({ authorizedMCP, pluginConfig, req })

  const transport = new WebStandardStreamableHTTPServerTransport({
    enableJsonResponse: true,
    sessionIdGenerator: undefined, // stateless mode
  })

  await server.connect(transport)

  const mcpRequest = new Request(req.url, {
    body: req.body,
    duplex: 'half',
    headers: req.headers,
    method: req.method,
  } as { duplex: 'half' } & RequestInit)

  return await transport.handleRequest(mcpRequest)
}
