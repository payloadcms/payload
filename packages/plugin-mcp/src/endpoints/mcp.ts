import type { PayloadHandler } from 'payload'

import type { MCPPluginConfig } from '../types.js'

import { createRequestFromPayloadRequest } from '../mcp/createRequest.js'
import { getMcpHandler } from '../mcp/getMcpHandler.js'
import { resolveAccessSettings } from './resolveAccessSettings.js'
import { withRestoredWebGlobals } from './withRestoredWebGlobals.js'

export const initializeMCPHandler = (pluginOptions: MCPPluginConfig) => {
  const mcpHandler: PayloadHandler = async (req) => {
    const useVerboseLogs = pluginOptions.mcp?.handlerOptions?.verboseLogs ?? false

    req.payloadAPI = 'MCP' as const

    const mcpAccessSettings = await resolveAccessSettings({ pluginOptions, req, useVerboseLogs })
    req.user = mcpAccessSettings.user

    return await withRestoredWebGlobals(async () => {
      const handler = getMcpHandler(pluginOptions, mcpAccessSettings, req)
      const request = createRequestFromPayloadRequest(req)
      return await handler(request)
    })
  }
  return mcpHandler
}
