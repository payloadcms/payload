import crypto from 'crypto'
import { type PayloadRequest, type TypedUser, UnauthorizedError, type Where } from 'payload'

import type { MCPAccessSettings, MCPPluginConfig } from '../types.js'

type ResolveAccessSettingsArgs = {
  pluginOptions: MCPPluginConfig
  req: PayloadRequest
  useVerboseLogs: boolean
}

const createDefaultAccessSettingsResolver = ({
  pluginOptions,
  req,
  useVerboseLogs,
}: ResolveAccessSettingsArgs) => {
  return async (overrideApiKey?: null | string): Promise<MCPAccessSettings> => {
    const authorization = req.headers.get('Authorization')
    const apiKey =
      overrideApiKey ??
      (authorization?.startsWith('Bearer ') ? authorization.replace('Bearer ', '').trim() : null)

    if (apiKey === null) {
      throw new UnauthorizedError()
    }

    const sha256APIKeyIndex = crypto
      .createHmac('sha256', req.payload.secret)
      .update(apiKey || '')
      .digest('hex')
    const where: Where = {
      apiKeyIndex: {
        equals: sha256APIKeyIndex,
      },
    }
    const { docs } = await req.payload.find({
      collection: 'payload-mcp-api-keys',
      depth: 1,
      limit: 1,
      pagination: false,
      where,
    })
    const apiKeyDoc = docs[0]

    if (!apiKeyDoc) {
      throw new UnauthorizedError()
    }

    if (useVerboseLogs) {
      req.payload.logger.info('[payload-mcp] API Key is valid')
    }

    const user = apiKeyDoc.user as TypedUser

    if (!user || typeof user !== 'object' || !('id' in user)) {
      throw new UnauthorizedError()
    }

    user.collection = pluginOptions.userCollection as string
    user._strategy = 'mcp-api-key' as const

    return apiKeyDoc as unknown as MCPAccessSettings
  }
}

export const resolveAccessSettings = async (
  args: ResolveAccessSettingsArgs,
): Promise<MCPAccessSettings> => {
  const getDefaultMcpAccessSettings = createDefaultAccessSettingsResolver(args)

  return args.pluginOptions.overrideAuth
    ? await args.pluginOptions.overrideAuth(args.req, getDefaultMcpAccessSettings)
    : await getDefaultMcpAccessSettings()
}
