import type { DefaultDocumentIDType, PayloadRequest, TypedUser } from 'payload'

import crypto from 'crypto'
import { UnauthorizedError } from 'payload'

import type { MCPAccess, MCPAPIKeysDoc, MCPPluginConfig } from '../types.js'

import {
  COLLECTION_BUILTIN_AUTH_TOOL_KEYS,
  COLLECTION_BUILTIN_TOOL_KEYS,
  GLOBAL_BUILTIN_TOOL_KEYS,
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

  const getAPIKeyDoc = async (overrideApiKey?: null | string): Promise<MCPAPIKeysDoc> => {
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
        apiKeyIndex: { equals: sha256APIKeyIndex },
      },
    })) as MCPAPIKeysDoc | null

    if (!doc) {
      throw new UnauthorizedError()
    }

    logger.info('API Key is valid')

    const userRef = doc.user
    const userID =
      typeof userRef === 'object' && userRef !== null && 'id' in userRef
        ? userRef.id
        : (userRef! as unknown as DefaultDocumentIDType)

    const user: TypedUser = (await req.payload.findByID({
      id: userID,
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
    return await pluginConfig.overrideAuth({ getAPIKeyDoc, getSanitizedAccess, req })
  }

  let apiKeyDoc: MCPAPIKeysDoc
  if (process.env.NODE_ENV === 'development' && !hasBearerToken) {
    logger.info('Dev mode: skipping API key check, using session user')
    apiKeyDoc = {
      access: {},
      overrideAccess: true,
      user: req.user ?? null,
    }
  } else {
    apiKeyDoc = await getAPIKeyDoc()
  }

  return getSanitizedAccess({ apiKeyDoc, pluginConfig, req })
}

export type GetSanitizedAccessFn = (args: {
  apiKeyDoc: MCPAPIKeysDoc
  pluginConfig: MCPPluginConfig
  req: PayloadRequest
}) => MCPAccess
/**
 * Ensures mcpAccess is complete, so every single collection / global / tool has an explicit `true` or `false` in the access tree.
 * It also merges in config-level access rules from the pluginConfig.
 * That way, further runtime checks do not have to worry about whether something is opt-in or opt-out, or
 * have to check both pluginConfig and mcpAccess to decide if a tool is enabled.
 */
const getSanitizedAccess: GetSanitizedAccessFn = ({ apiKeyDoc, pluginConfig, req }) => {
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
    const collectionAccess = ((mcpAccess.access.collections ??= {})[collection.slug] ??= {})
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
        if (matchedConfigEntry === true || apiKeyDocCollectionAccess[authToolKey] === true) {
          collectionAccess[authToolKey] = true
          continue
        }

        // auth is opt-out
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
    const globalAccess = ((mcpAccess.access.globals ??= {})[global.slug] ??= {})
    const apiKeyDocCollectionAccess = apiKeyDoc.access.globals?.[global.slug] ?? {}

    for (const toolKey of GLOBAL_BUILTIN_TOOL_KEYS) {
      const matchedConfigEntry = pluginConfig.globals?.[global.slug]?.tools?.[toolKey]
      if (matchedConfigEntry === false || apiKeyDocCollectionAccess[toolKey] === false) {
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
      if (customTool === false || apiKeyDocCollectionAccess[key] === false) {
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
