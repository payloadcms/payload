import crypto from 'crypto'
import { type PayloadHandler, type TypedUser, UnauthorizedError, type Where } from 'payload'

import type { MCPAccessSettings, PluginMCPServerConfig } from '../types.js'

import { createRequestFromPayloadRequest } from '../mcp/createRequest.js'
import { getMCPHandler } from '../mcp/getMcpHandler.js'

export const initializeMCPHandler = (pluginOptions: PluginMCPServerConfig) => {
  const mcpHandler: PayloadHandler = async (req) => {
    const { payload } = req
    const MCPOptions = pluginOptions.mcp || {}
    const MCPHandlerOptions = MCPOptions.handlerOptions || {}
    const useVerboseLogs = MCPHandlerOptions.verboseLogs ?? false

    req.payloadAPI = 'MCP' as const

    const getDefaultMcpAccessSettings = async (overrideApiKey?: null | string) => {
      const apiKey =
        (overrideApiKey ?? req.headers.get('Authorization')?.startsWith('Bearer '))
          ? req.headers.get('Authorization')?.replace('Bearer ', '').trim()
          : null

      if (apiKey === null) {
        throw new UnauthorizedError()
      }

      const sha256APIKeyIndex = crypto
        .createHmac('sha256', payload.secret)
        .update(apiKey || '')
        .digest('hex')

      const where: Where = {
        apiKeyIndex: {
          equals: sha256APIKeyIndex,
        },
      }

      const { docs } = await payload.find({
        collection: 'payload-mcp-api-keys',
        depth: 1,
        limit: 1,
        pagination: false,
        where,
      })

      if (docs.length === 0) {
        throw new UnauthorizedError()
      }

      if (useVerboseLogs) {
        payload.logger.info('[payload-mcp] API Key is valid')
      }

      const user = docs[0]?.user as TypedUser
      user.collection = pluginOptions.userCollection as string
      user._strategy = 'mcp-api-key' as const

      return docs[0] as unknown as MCPAccessSettings
    }

    const mcpAccessSettings = pluginOptions.overrideAuth
      ? await pluginOptions.overrideAuth(req, getDefaultMcpAccessSettings)
      : await getDefaultMcpAccessSettings()

    const handler = getMCPHandler(pluginOptions, mcpAccessSettings, req)
    const request = createRequestFromPayloadRequest(req)
    return await handler(request)
  }
  return mcpHandler
}
