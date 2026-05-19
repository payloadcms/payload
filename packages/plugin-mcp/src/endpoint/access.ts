import type { DefaultDocumentIDType, PayloadRequest, TypedUser } from 'payload'

import crypto from 'crypto'
import { UnauthorizedError } from 'payload'

import type { AuthorizedMCP, MCPAPIKeysDoc } from '../types.js'

import { getLogger } from '../utils/getLogger.js'
import { getPluginConfig } from '../utils/getPluginConfig.js'

/**
 * Resolves the API key (or dev-mode session) and returns the items the caller
 * may use. Denied items are dropped from the array.
 */
export const getAuthorizedMCP: (args: { req: PayloadRequest }) => Promise<AuthorizedMCP> = async ({
  req,
}) => {
  const logger = getLogger({ payload: req.payload })
  const pluginConfig = getPluginConfig({ config: req.payload.config })

  const authHeader = req.headers.get('Authorization')
  const hasBearerToken = authHeader?.startsWith('Bearer ')

  const buildAuthorized = (apiKeyDoc: MCPAPIKeysDoc): AuthorizedMCP => ({
    items: pluginConfig.items.filter((item) => {
      switch (item.type) {
        case 'collectionTool':
          return apiKeyDoc.access.collections?.[item.collectionSlug]?.[item.key] !== false
        case 'globalTool':
          return apiKeyDoc.access.globals?.[item.globalSlug]?.[item.key] !== false
        case 'prompt':
          return apiKeyDoc.access.prompts?.[item.key] !== false
        case 'resource':
          return apiKeyDoc.access.resources?.[item.key] !== false
        case 'tool':
          return apiKeyDoc.access.tools?.[item.key] !== false
      }
    }),
    overrideAccess:
      typeof apiKeyDoc.overrideAccess === 'boolean' ? apiKeyDoc.overrideAccess : false,
    user: apiKeyDoc.user,
  })

  if (pluginConfig.overrideAuth) {
    return await pluginConfig.overrideAuth({
      getAPIKeyDoc: (overrideApiKey) => getAPIKeyDoc({ logger, overrideApiKey, pluginConfig, req }),
      getAuthorizedMCP: ({ apiKeyDoc }) => buildAuthorized(apiKeyDoc),
      pluginConfig,
      req,
    })
  }

  if (process.env.NODE_ENV === 'development' && !hasBearerToken) {
    logger.info('Dev mode: skipping API key check, using session user')
    return buildAuthorized({
      id: -1,
      access: {},
      overrideAccess: true,
      user: req.user ?? null,
    })
  }

  return buildAuthorized(await getAPIKeyDoc({ logger, pluginConfig, req }))
}

const getAPIKeyDoc = async ({
  logger,
  overrideApiKey,
  pluginConfig,
  req,
}: {
  logger: ReturnType<typeof getLogger>
  overrideApiKey?: string
  pluginConfig: ReturnType<typeof getPluginConfig>
  req: PayloadRequest
}): Promise<MCPAPIKeysDoc> => {
  const authHeader = req.headers.get('Authorization')
  const hasBearerToken = authHeader?.startsWith('Bearer ')

  const apiKey =
    overrideApiKey ?? (hasBearerToken ? authHeader?.replace('Bearer ', '').trim() || null : null)

  if (!apiKey) {
    throw new UnauthorizedError()
  }

  const sha256APIKeyIndex = crypto
    .createHmac('sha256', req.payload.secret)
    .update(apiKey)
    .digest('hex')

  const doc = await req.payload.db.findOne<MCPAPIKeysDoc>({
    collection: 'payload-mcp-api-keys',
    req,
    where: {
      apiKeyIndex: { equals: sha256APIKeyIndex },
    },
  })

  if (!doc || !doc.user) {
    throw new UnauthorizedError()
  }

  logger.info('API Key is valid')

  const userRef = doc.user
  const userID =
    typeof userRef === 'object' && userRef !== null && 'id' in userRef
      ? userRef.id
      : (userRef as unknown as DefaultDocumentIDType)

  const user = (await req.payload.findByID({
    id: userID,
    collection: pluginConfig.userCollection,
    depth: 0,
    disableErrors: true,
    req,
  })) as null | TypedUser

  if (!user) {
    throw new UnauthorizedError()
  }

  return {
    ...doc,
    user: {
      ...user,
      _strategy: 'mcp-api-key' as const,
      collection: pluginConfig.userCollection,
    },
  }
}
