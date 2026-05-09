import crypto from 'crypto'
import { type PayloadHandler, type TypedUser, UnauthorizedError, type Where } from 'payload'

import type { MCPAccessSettings } from '../types.js'

import { createRequestFromPayloadRequest } from '../mcp/createRequest.js'
import { getMCPHandler } from '../mcp/getMcpHandler.js'
import { getDevAccessSettings } from '../mcp/helpers/getDevAccessSettings.js'
import { getLogger } from '../utils/getLogger.js'
import { getPluginConfig } from '../utils/getPluginConfig.js'

export const mcpEndpoint: PayloadHandler = async (req) => {
  req.payloadAPI = 'MCP' as const

  const { payload } = req

  const pluginConfig = getPluginConfig({ config: req.payload.config })
  const logger = getLogger({ payload })

  const authHeader = req.headers.get('Authorization')

  const hasBearerToken = authHeader?.startsWith('Bearer ')

  const getDefaultMcpAccessSettings = async (overrideApiKey?: null | string) => {
    const apiKey =
      overrideApiKey ?? (hasBearerToken ? authHeader?.replace('Bearer ', '').trim() || null : null)

    if (!apiKey) {
      throw new UnauthorizedError()
    }

    const sha256APIKeyIndex = crypto
      .createHmac('sha256', payload.secret)
      .update(apiKey || '')
      .digest('hex')

    const doc = (await payload.db.findOne({
      collection: 'payload-mcp-api-keys',
      req,
      where: {
        apiKeyIndex: {
          equals: sha256APIKeyIndex,
        },
      },
    })) as MCPAccessSettings | null

    if (!doc) {
      throw new UnauthorizedError()
    }

    logger.info('API Key is valid')

    const userID = doc.user

    const user: TypedUser = (await payload.findByID({
      id: 'id' in userID ? userID.id : userID,
      collection: pluginConfig.userCollection!,
      depth: 0,
      req,
    })) as TypedUser

    user.collection = pluginConfig.userCollection as string
    user._strategy = 'mcp-api-key' as const

    doc.user = user

    return doc
  }

  const isDevelopment = process.env.NODE_ENV === 'development'

  let mcpAccessSettings: MCPAccessSettings
  if (pluginConfig.overrideAuth) {
    mcpAccessSettings = await pluginConfig.overrideAuth(req, getDefaultMcpAccessSettings)
    if (typeof mcpAccessSettings.overrideAccess !== 'boolean') {
      mcpAccessSettings.overrideAccess = false
    }
  } else if (isDevelopment && !hasBearerToken) {
    logger.info('Dev mode: skipping API key check, using session user')

    mcpAccessSettings = getDevAccessSettings(pluginConfig, req.user ?? null)
  } else {
    mcpAccessSettings = await getDefaultMcpAccessSettings()
    if (typeof mcpAccessSettings.overrideAccess !== 'boolean') {
      mcpAccessSettings.overrideAccess = false
    }
  }

  const handler = await getMCPHandler(pluginConfig, mcpAccessSettings, req)

  return await handler(createRequestFromPayloadRequest(req))
}
