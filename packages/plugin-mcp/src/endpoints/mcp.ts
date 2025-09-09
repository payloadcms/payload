import crypto from 'crypto'
import { APIError, type Config, type PayloadHandler, type Where } from 'payload'

import type { PluginMCPServerConfig, ToolSettings } from '../types.js'

import { createRequestFromPayloadRequest } from '../mcp/createRequest.js'
import { getMCPHandler } from '../mcp/getMcpHandler.js'

export const initializeMCPHandler = (pluginOptions: PluginMCPServerConfig, config: Config) => {
  const mcpHandler: PayloadHandler = async (req) => {
    const { payload } = req
    const MCPOptions = pluginOptions.mcp || {}
    const MCPHandlerOptions = MCPOptions.handlerOptions || {}
    const useVerboseLogs = MCPHandlerOptions.verboseLogs ?? false

    const apiKey = req.headers.get('Authorization')?.startsWith('Bearer ')
      ? req.headers.get('Authorization')?.replace('Bearer ', '').trim()
      : null

    if (apiKey === null) {
      throw new APIError('API Key is required', 401)
    }

    const sha1APIKeyIndex = crypto
      .createHmac('sha1', payload.secret)
      .update(apiKey || '')
      .digest('hex')
    const sha256APIKeyIndex = crypto
      .createHmac('sha256', payload.secret)
      .update(apiKey || '')
      .digest('hex')

    const apiKeyConstraints = [
      {
        apiKeyIndex: {
          equals: sha1APIKeyIndex,
        },
      },
      {
        apiKeyIndex: {
          equals: sha256APIKeyIndex,
        },
      },
    ]
    const where: Where = {
      or: apiKeyConstraints,
    }

    const { docs } = await payload.find({
      collection: 'payload-mcp-tool-api-key',
      where,
    })

    if (docs.length === 0) {
      throw new APIError('API Key is invalid', 401)
    }

    const MCPToolCapabilities = docs[0] as ToolSettings

    if (useVerboseLogs) {
      payload.logger.info('[payload-mcp] API Key is valid')
    }

    const request = createRequestFromPayloadRequest(req)
    const handler = getMCPHandler(pluginOptions, MCPToolCapabilities, req, config)
    return await handler(request)
  }
  return mcpHandler
}
