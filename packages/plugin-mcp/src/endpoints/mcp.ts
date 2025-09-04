import type { PayloadHandler } from 'payload'

import type { GlobalSettings, PluginMCPServerConfig } from '../types.js'

import { createRequestFromPayloadRequest } from '../mcp/createRequest.js'
import { getMCPHandler } from '../mcp/getMcpHandler.js'

export const initializeMCPHandler = (pluginOptions: PluginMCPServerConfig) => {
  let toolsSettings: GlobalSettings['tools'] | undefined

  const mcpHandler: PayloadHandler = async (req) => {
    if (!toolsSettings) {
      toolsSettings = await req.payload.findGlobal({
        slug: 'payload-mcp-tools',
        user: req.user,
      })
    }

    const globalSettings = {
      tools: toolsSettings,
    } as GlobalSettings

    const request = createRequestFromPayloadRequest(req)
    const handler = getMCPHandler(pluginOptions, globalSettings, req)
    return await handler(request)
  }
  return mcpHandler
}
