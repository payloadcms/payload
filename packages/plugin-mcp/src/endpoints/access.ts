import type { PayloadRequest, TypedUser } from 'payload'

import crypto from 'crypto'
import { UnauthorizedError } from 'payload'

import type { MCPAccess, MCPPluginConfig } from '../types.js'

import { getLogger } from '../utils/getLogger.js'
import { getPluginConfig } from '../utils/getPluginConfig.js'

export const getMCPAccess: (args: { req: PayloadRequest }) => Promise<MCPAccess> = async ({
  req,
}) => {
  const logger = getLogger({ payload: req.payload })
  const pluginConfig = getPluginConfig({ config: req.payload.config })

  const authHeader = req.headers.get('Authorization')
  const hasBearerToken = authHeader?.startsWith('Bearer ')

  const getDefaultMCPAccess = async (overrideApiKey?: null | string) => {
    const apiKey =
      overrideApiKey ?? (hasBearerToken ? authHeader?.replace('Bearer ', '').trim() || null : null)

    if (!apiKey) {
      throw new UnauthorizedError()
    }

    const sha256APIKeyIndex = crypto
      .createHmac('sha256', req.payload.secret)
      .update(apiKey || '')
      .digest('hex')

    const doc = (await req.payload.db.findOne({
      collection: 'payload-mcp-api-keys',
      req,
      where: {
        apiKeyIndex: {
          equals: sha256APIKeyIndex,
        },
      },
    })) as MCPAccess | null

    if (!doc) {
      throw new UnauthorizedError()
    }

    logger.info('API Key is valid')

    const userID = doc.user!

    const user: TypedUser = (await req.payload.findByID({
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

  if (pluginConfig.overrideAuth) {
    const mcpAccess = await pluginConfig.overrideAuth(req, getDefaultMCPAccess)
    if (typeof mcpAccess.overrideAccess !== 'boolean') {
      mcpAccess.overrideAccess = false
    }
    return mcpAccess
  } else if (process.env.NODE_ENV === 'development' && !hasBearerToken) {
    logger.info('Dev mode: skipping API key check, using session user')

    return getDevAccessSettings(pluginConfig, req.user ?? null)
  } else {
    const mcpAccess = await getDefaultMCPAccess()
    if (typeof mcpAccess.overrideAccess !== 'boolean') {
      mcpAccess.overrideAccess = false
    }
    return mcpAccess
  }
}

/**
 * Builds full-access MCP access settings for development mode. Since the plugin
 * runtime now treats unset / `undefined` access fields as "allowed" (only `false`
 * blocks), we just return the minimum needed: a user reference and the auth opt-in
 * grants for the experimental auth tools, which use truthy checks.
 */
const getDevAccessSettings = (
  pluginOptions: MCPPluginConfig,
  user: null | TypedUser,
): MCPAccess => {
  const settings: MCPAccess = { overrideAccess: true, user }

  if (pluginOptions.experimental?.tools?.auth?.enabled) {
    settings.auth = {
      auth: true,
      forgotPassword: true,
      login: true,
      resetPassword: true,
      unlock: true,
      verify: true,
    }
  }

  return settings
}
