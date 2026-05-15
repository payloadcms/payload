import type { DefaultDocumentIDType, PayloadRequest, TypedUser } from 'payload'

import crypto from 'crypto'
import { UnauthorizedError } from 'payload'

import type { MCPAccess, MCPAPIKeysDoc, MCPPluginConfig } from '../types.js'

import {
  COLLECTION_BUILTIN_AUTH_TOOL_KEYS,
  COLLECTION_BUILTIN_TOOL_KEYS,
  GLOBAL_BUILTIN_TOOL_KEYS,
  HARD_EXCLUDED_COLLECTION_SLUGS,
} from '../mcp/buildTools.js'
import { getLogger } from '../utils/getLogger.js'
import { getPluginConfig } from '../utils/getPluginConfig.js'

export const getMCPAccess: (args: { req: PayloadRequest }) => Promise<MCPAccess> = async ({
  req,
}) => {
  const logger = getLogger({ payload: req.payload })
  const pluginConfig = getPluginConfig({ config: req.payload.config })

  const authHeader = req.headers.get('Authorization')
  const hasBearerToken = authHeader?.startsWith('Bearer ')

  const getAPIKeyDoc = async (overrideApiKey?: string): Promise<MCPAPIKeysDoc> => {
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
      collection: pluginConfig.userCollection!,
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
        collection: pluginConfig.userCollection as string,
      },
    }
  }

  if (pluginConfig.overrideAuth) {
    return await pluginConfig.overrideAuth({
      getAPIKeyDoc,
      getSanitizedAccess: ({ apiKeyDoc }) => getSanitizedAccess({ apiKeyDoc, pluginConfig, req }),
      pluginConfig,
      req,
    })
  }

  let apiKeyDoc: MCPAPIKeysDoc
  if (process.env.NODE_ENV === 'development' && !hasBearerToken) {
    logger.info('Dev mode: skipping API key check, using session user')
    apiKeyDoc = {
      id: -1,
      access: {},
      overrideAccess: true,
      user: req.user ?? null,
    }
  } else {
    apiKeyDoc = await getAPIKeyDoc()
  }

  return getSanitizedAccess({ apiKeyDoc, pluginConfig, req })
}

/**
 * Ensures mcpAccess is complete, so every single collection / global / tool has an explicit `true` or `false` in the access tree.
 * It also merges in config-level access rules from the pluginConfig.
 * That way, further runtime checks do not have to worry about whether something is opt-in or opt-out, or
 * have to check both pluginConfig and mcpAccess to decide if a tool is enabled.
 */
const getSanitizedAccess: (args: {
  apiKeyDoc: MCPAPIKeysDoc
  pluginConfig: MCPPluginConfig
  req: PayloadRequest
}) => MCPAccess = ({ apiKeyDoc, pluginConfig, req }) => {
  const mcpAccess: MCPAccess = {
    access: {
      collections: {},
      globals: {},
      prompts: {},
      resources: {},
      tools: {},
    },
    overrideAccess:
      typeof apiKeyDoc.overrideAccess === 'boolean' ? apiKeyDoc.overrideAccess : false,
    user: apiKeyDoc.user,
  }

  for (const collection of req.payload.config.collections) {
    if (HARD_EXCLUDED_COLLECTION_SLUGS.has(collection.slug)) {
      continue
    }
    const collectionAccess = (mcpAccess.access.collections[collection.slug] ??= {})
    const apiKeyDocCollectionAccess = apiKeyDoc.access.collections?.[collection.slug] ?? {}

    // TODO: consider having just a COLLECTION_BUILTIN_TOOLS list that is a list of the actual tools, not just the keys
    for (const toolKey of COLLECTION_BUILTIN_TOOL_KEYS) {
      const matchedConfigEntry = pluginConfig.collections?.[collection.slug]?.tools?.[toolKey]
      if (matchedConfigEntry === false || apiKeyDocCollectionAccess[toolKey] === false) {
        collectionAccess[toolKey] = false
        continue
      }
      // Built-in tools are opt-out => no need to check if matchedConfigEntry === true, we treat both `undefined` and `true` as enabled
      collectionAccess[toolKey] = true
    }

    if (collection.auth) {
      for (const authToolKey of COLLECTION_BUILTIN_AUTH_TOOL_KEYS) {
        const matchedConfigEntry = pluginConfig.collections?.[collection.slug]?.tools?.[authToolKey]

        if (apiKeyDocCollectionAccess[authToolKey] !== false && matchedConfigEntry) {
          collectionAccess[authToolKey] = true
          continue
        }

        // auth is opt-in
        collectionAccess[authToolKey] = false
      }
    }

    const customTools = Object.entries(
      pluginConfig.collections?.[collection.slug]?.tools ?? {},
    ).filter(
      ([key]) =>
        !COLLECTION_BUILTIN_TOOL_KEYS.has(key) && !COLLECTION_BUILTIN_AUTH_TOOL_KEYS.has(key),
    )

    for (const [key, customTool] of customTools) {
      if (customTool === false || apiKeyDocCollectionAccess[key] === false) {
        collectionAccess[key] = false
        continue
      }
      collectionAccess[key] = true
    }
  }

  for (const global of req.payload.config.globals) {
    const globalAccess = (mcpAccess.access.globals[global.slug] ??= {})
    const apiKeyDocGlobalAccess = apiKeyDoc.access.globals?.[global.slug] ?? {}

    for (const toolKey of GLOBAL_BUILTIN_TOOL_KEYS) {
      const matchedConfigEntry = pluginConfig.globals?.[global.slug]?.tools?.[toolKey]
      if (matchedConfigEntry === false || apiKeyDocGlobalAccess[toolKey] === false) {
        globalAccess[toolKey] = false
        continue
      }
      // Built-in tools are opt-out
      globalAccess[toolKey] = true
    }

    const customTools = Object.entries(pluginConfig.globals?.[global.slug]?.tools ?? {}).filter(
      ([key]) => !GLOBAL_BUILTIN_TOOL_KEYS.has(key),
    )

    for (const [key, customTool] of customTools) {
      if (customTool === false || apiKeyDocGlobalAccess[key] === false) {
        globalAccess[key] = false
        continue
      }
      globalAccess[key] = true
    }
  }

  for (const promptKey of Object.keys(pluginConfig.prompts ?? {})) {
    if (apiKeyDoc.access.prompts?.[promptKey] === false) {
      mcpAccess.access.prompts[promptKey] = false
      continue
    }
    mcpAccess.access.prompts[promptKey] = true
  }

  for (const resourceKey of Object.keys(pluginConfig.resources ?? {})) {
    if (apiKeyDoc.access.resources?.[resourceKey] === false) {
      mcpAccess.access.resources[resourceKey] = false
      continue
    }
    mcpAccess.access.resources[resourceKey] = true
  }

  for (const toolKey of Object.keys(pluginConfig.tools ?? {})) {
    if (apiKeyDoc.access.tools?.[toolKey] === false) {
      mcpAccess.access.tools[toolKey] = false
      continue
    }
    mcpAccess.access.tools[toolKey] = true
  }

  return mcpAccess
}
