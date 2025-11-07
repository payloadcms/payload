import crypto from 'crypto'
import { APIError, type PayloadHandler, type Where } from 'payload'

import type { MCPAccessSettings, PluginMCPServerConfig } from '../types.js'

import { createRequestFromPayloadRequest } from '../mcp/createRequest.js'
import { getMCPHandler } from '../mcp/getMcpHandler.js'

export const initializeMCPHandler = (pluginOptions: PluginMCPServerConfig) => {
  const mcpHandler: PayloadHandler = async (req) => {
    const { payload } = req
    const MCPOptions = pluginOptions.mcp || {}
    const MCPHandlerOptions = MCPOptions.handlerOptions || {}
    const useVerboseLogs = MCPHandlerOptions.verboseLogs ?? false

    let mcpAccessSettings: MCPAccessSettings

    if (pluginOptions.overrideAuth) {
      try {
        mcpAccessSettings = await pluginOptions.overrideAuth(req)
        if (useVerboseLogs) {
          payload.logger.info('[payload-mcp] Custom authentication method successful')
        }
      } catch (error) {
        payload.logger.error({
          err: error,
          msg: '[payload-mcp] Custom authentication method failed',
        })
        throw new APIError('Authentication failed', 401)
      }
    } else {
      const apiKey = req.headers.get('Authorization')?.startsWith('Bearer ')
        ? req.headers.get('Authorization')?.replace('Bearer ', '').trim()
        : null

      if (apiKey === null) {
        throw new APIError('API Key is required', 401)
      }

      const sha256APIKeyIndex = crypto
        .createHmac('sha256', payload.secret)
        .update(apiKey || '')
        .digest('hex')

      const apiKeyConstraints = [
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
        collection: 'payload-mcp-api-keys',
        where,
      })

      if (docs.length === 0) {
        throw new APIError('API Key is invalid', 401)
      }

      mcpAccessSettings = docs[0] as MCPAccessSettings

      if (useVerboseLogs) {
        payload.logger.info('[payload-mcp] API Key is valid')
      }
    }

    const handler = getMCPHandler(pluginOptions, mcpAccessSettings, req)
    const request = createRequestFromPayloadRequest(req)
    return await handler(request)
  }
  return mcpHandler
}
