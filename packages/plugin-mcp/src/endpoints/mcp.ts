import { McpServer, WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/server'
import { type PayloadHandler } from 'payload'

import { registerCollectionTools } from '../mcp/registerCollectionTools.js'
import { registerCustomItems } from '../mcp/registerCustomItems.js'
import { registerExperimentalAuthTools } from '../mcp/registerExperimentalAuthTools.js'
import { registerGlobalTools } from '../mcp/registerGlobalTools.js'
import { getPluginConfig } from '../utils/getPluginConfig.js'
import { getMCPAccess } from './access.js'
import { createRequestFromPayloadRequest } from './createRequest.js'

export const mcpEndpoint: PayloadHandler = async (req) => {
  req.payloadAPI = 'MCP' as const

  const pluginConfig = getPluginConfig({ config: req.payload.config })
  const mcpAccess = await getMCPAccess({ req })
  const serverOptions = pluginConfig.mcp?.serverOptions || {}

  const server = new McpServer(
    { name: 'Payload MCP Server', version: '1.0.0', ...serverOptions.serverInfo },
    serverOptions.options,
  )

  registerCollectionTools({
    mcpAccess,
    req,
    server,
  })

  registerGlobalTools({
    mcpAccess,
    req,
    server,
  })

  registerCustomItems({
    mcpAccess,
    req,
    server,
  })

  if (process.env.NODE_ENV === 'development') {
    registerExperimentalAuthTools({
      mcpAccess,
      req,
      server,
    })
  }

  const transport = new WebStandardStreamableHTTPServerTransport({
    enableJsonResponse: true,
    sessionIdGenerator: undefined, // stateless mode
  })

  await server.connect(transport)

  return await transport.handleRequest(createRequestFromPayloadRequest(req))
}
