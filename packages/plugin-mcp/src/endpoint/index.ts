import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/server'
import { AuthenticationError, type PayloadHandler } from 'payload'

import { buildMcpServer } from '../mcp/buildMcpServer.js'
import { getPluginConfig } from '../utils/getPluginConfig.js'
import { getAuthorizedMCP } from './access.js'

export const mcpEndpoint: PayloadHandler = async (req) => {
  if (!req.url) {
    throw new AuthenticationError()
  }

  req.payloadAPI = 'MCP' as const

  const pluginConfig = getPluginConfig({ config: req.payload.config })
  const authorizedMCP = await getAuthorizedMCP({ req })

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
