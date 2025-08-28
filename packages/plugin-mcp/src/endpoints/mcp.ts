import type { PayloadHandler } from 'payload'

import type { GlobalSettings, PluginMcpServerConfig } from '../types.js'

import { createRequestFromPayloadRequest } from '../mcp/createRequest.js'
import { getMcpHandler } from '../mcp/getMcpHandler.js'

export const initializeMcpHandler = (pluginOptions: PluginMcpServerConfig) => {
  const mcpHandler: PayloadHandler = async (req) => {
    const endpointSettings = await req.payload.findGlobal({
      slug: 'payload-mcp-endpoint',
      user: req.user,
    })
    const toolsSettings = await req.payload.findGlobal({
      slug: 'payload-mcp-tools',
      user: req.user,
    })
    const globalSettings = {
      endpoint: endpointSettings,
      tools: toolsSettings,
    } as GlobalSettings

    const request = createRequestFromPayloadRequest(req)
    const handler = getMcpHandler(pluginOptions, globalSettings, req)
    return await handler(request)
  }
  return mcpHandler
}
