import type { DefaultDocumentIDType, PayloadRequest, TypedUser } from 'payload'

import crypto from 'crypto'
import { configToJSONSchema, UnauthorizedError } from 'payload'

import type { CollectionBuiltinAuthToolKey } from '../mcp/constants.js'
import type {
  AuthorizedMCP,
  CollectionTool,
  GlobalTool,
  JsonSchemaObject,
  MCPAPIKeysDoc,
  MCPCollectionToolEntry,
  MCPGlobalToolEntry,
  MCPPluginConfig,
  MCPResponseOverride,
  Tool,
} from '../types.js'

import { buildAuthTool } from '../mcp/builtin/collections/authTools.js'
import { buildCreateCollectionTool } from '../mcp/builtin/collections/createTool.js'
import { buildDeleteCollectionTool } from '../mcp/builtin/collections/deleteTool.js'
import { buildFindCollectionTool } from '../mcp/builtin/collections/findTool.js'
import { buildUpdateCollectionTool } from '../mcp/builtin/collections/updateTool.js'
import { buildFindGlobalTool } from '../mcp/builtin/globals/findTool.js'
import { buildUpdateGlobalTool } from '../mcp/builtin/globals/updateTool.js'
import {
  COLLECTION_BUILTIN_AUTH_TOOL_KEYS,
  COLLECTION_BUILTIN_TOOL_KEYS,
  GLOBAL_BUILTIN_TOOL_KEYS,
  HARD_EXCLUDED_COLLECTION_SLUGS,
} from '../mcp/constants.js'
import { getLogger } from '../utils/getLogger.js'
import { getPluginConfig } from '../utils/getPluginConfig.js'
import {
  getCollectionVirtualFieldNames,
  getGlobalVirtualFieldNames,
} from '../utils/getVirtualFieldNames.js'
import { removeVirtualFieldsFromSchema } from '../utils/schemaConversion/removeVirtualFieldsFromSchema.js'

/**
 * Returns an object containing all active and authorized MCP tools, prompts
 * and resources.
 * Denied capabilities are simply absent from the result.
 */
export const getAuthorizedMCP: (args: { req: PayloadRequest }) => Promise<AuthorizedMCP> = async ({
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
      getAuthorizedMCP: ({ apiKeyDoc }) => buildAuthorizedMCP({ apiKeyDoc, pluginConfig, req }),
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

  return buildAuthorizedMCP({ apiKeyDoc, pluginConfig, req })
}

/**
 * Walks the Payload config + plugin config once, deciding accessibility per
 * (scope, slug, key) and stamping the resolved tool into the result. Denied
 * entries are skipped, not stamped — so the endpoint can iterate and register
 * without any further access checks.
 */
const buildAuthorizedMCP = ({
  apiKeyDoc,
  pluginConfig,
  req,
}: {
  apiKeyDoc: MCPAPIKeysDoc
  pluginConfig: MCPPluginConfig
  req: PayloadRequest
}): AuthorizedMCP => {
  const authorizedMCP: AuthorizedMCP = {
    collections: {},
    globals: {},
    overrideAccess:
      typeof apiKeyDoc.overrideAccess === 'boolean' ? apiKeyDoc.overrideAccess : false,
    prompts: {},
    resources: {},
    tools: {},
    user: apiKeyDoc.user,
  }

  const configSchema = configToJSONSchema(
    req.payload.config,
    req.payload.db.defaultIDType,
    req.i18n,
    {
      forceInlineBlocks: true,
    },
  ) as JsonSchemaObject

  for (const collection of req.payload.config.collections) {
    if (HARD_EXCLUDED_COLLECTION_SLUGS.includes(collection.slug)) {
      continue
    }
    const collectionAccess = (authorizedMCP.collections[collection.slug] ??= {})
    const apiKeyDocCollectionAccess = apiKeyDoc.access.collections?.[collection.slug] ?? {}

    for (const toolKey of COLLECTION_BUILTIN_TOOL_KEYS) {
      const toolPluginConfig = pluginConfig.collections?.[collection.slug]?.tools?.[toolKey]
      if (toolPluginConfig === false || apiKeyDocCollectionAccess[toolKey] === false) {
        continue
      }
      // Built-in tools are opt-out
      collectionAccess[toolKey] = buildCollectionBuiltinTool({
        collectionPluginConfig: pluginConfig.collections?.[collection.slug],
        collectionSlug: collection.slug,
        configSchema,
        req,
        toolKey,
        toolPluginConfig,
      })
    }

    if (collection.auth) {
      for (const authToolKey of COLLECTION_BUILTIN_AUTH_TOOL_KEYS) {
        const toolPluginConfig = pluginConfig.collections?.[collection.slug]?.tools?.[authToolKey]

        if (apiKeyDocCollectionAccess[authToolKey] !== false && toolPluginConfig) {
          collectionAccess[authToolKey] = buildAuthTool({
            name: authToolKey as CollectionBuiltinAuthToolKey,
            collectionSlug: collection.slug,
            description:
              typeof toolPluginConfig === 'object'
                ? (toolPluginConfig as { description?: string }).description
                : undefined,
          })
          continue
        }

        // auth is opt-in — skip
      }
    }

    const customTools = Object.entries(
      pluginConfig.collections?.[collection.slug]?.tools ?? {},
    ).filter(
      ([key]) =>
        !COLLECTION_BUILTIN_TOOL_KEYS.includes(key) &&
        !COLLECTION_BUILTIN_AUTH_TOOL_KEYS.includes(key),
    )

    for (const [key, customTool] of customTools) {
      if (customTool === false || apiKeyDocCollectionAccess[key] === false) {
        continue
      }
      collectionAccess[key] = customTool as CollectionTool
    }
  }

  for (const global of req.payload.config.globals) {
    const globalAccess = (authorizedMCP.globals[global.slug] ??= {})
    const apiKeyDocGlobalAccess = apiKeyDoc.access.globals?.[global.slug] ?? {}

    for (const toolKey of GLOBAL_BUILTIN_TOOL_KEYS) {
      const toolPluginConfig = pluginConfig.globals?.[global.slug]?.tools?.[toolKey]
      if (toolPluginConfig === false || apiKeyDocGlobalAccess[toolKey] === false) {
        continue
      }
      // Built-in tools are opt-out
      globalAccess[toolKey] = buildGlobalBuiltinTool({
        configSchema,
        globalPluginConfig: pluginConfig.globals?.[global.slug],
        globalSlug: global.slug,
        key: toolKey,
        req,
        toolPluginConfig,
      })
    }

    const customTools = Object.entries(pluginConfig.globals?.[global.slug]?.tools ?? {}).filter(
      ([key]) => !GLOBAL_BUILTIN_TOOL_KEYS.includes(key),
    )

    for (const [key, customTool] of customTools) {
      if (customTool === false || apiKeyDocGlobalAccess[key] === false) {
        continue
      }
      globalAccess[key] = customTool as GlobalTool
    }
  }

  for (const promptKey of Object.keys(pluginConfig.prompts ?? {})) {
    if (apiKeyDoc.access.prompts?.[promptKey] === false) {
      continue
    }
    authorizedMCP.prompts[promptKey] = pluginConfig.prompts![promptKey]!
  }

  for (const resourceKey of Object.keys(pluginConfig.resources ?? {})) {
    if (apiKeyDoc.access.resources?.[resourceKey] === false) {
      continue
    }
    authorizedMCP.resources[resourceKey] = pluginConfig.resources![resourceKey]!
  }

  for (const toolKey of Object.keys(pluginConfig.tools ?? {})) {
    if (apiKeyDoc.access.tools?.[toolKey] === false) {
      continue
    }
    authorizedMCP.tools[toolKey] = pluginConfig.tools![toolKey]! as Tool
  }

  return authorizedMCP
}

/**
 * Per-built-in dispatch + description/overrideResponse fallback. Wrapped so the
 * loops above can stay single-line at the call site.
 */
const buildCollectionBuiltinTool = ({
  collectionPluginConfig,
  collectionSlug,
  configSchema,
  req,
  toolKey,
  toolPluginConfig: _toolPluginConfig,
}: {
  collectionPluginConfig?: {
    description?: string
    overrideResponse?: MCPResponseOverride
  }
  collectionSlug: string
  configSchema: JsonSchemaObject
  req: PayloadRequest
  toolKey: string
  toolPluginConfig?: MCPCollectionToolEntry
}): CollectionTool => {
  const toolPluginConfig =
    _toolPluginConfig && typeof _toolPluginConfig === 'object' ? _toolPluginConfig : undefined

  const description = toolPluginConfig?.description ?? collectionPluginConfig?.description
  const overrideResponse =
    toolPluginConfig?.overrideResponse ?? collectionPluginConfig?.overrideResponse

  const rawSchema = configSchema.definitions?.[collectionSlug]
  const virtualFieldNames = getCollectionVirtualFieldNames(req.payload.config, collectionSlug)
  const schema = rawSchema
    ? removeVirtualFieldsFromSchema(
        JSON.parse(JSON.stringify(rawSchema)) as JsonSchemaObject,
        virtualFieldNames,
      )
    : ({ type: 'object', properties: {} } as JsonSchemaObject)

  if (toolKey === 'find') {
    return buildFindCollectionTool({ collectionSlug, description, overrideResponse })
  }
  if (toolKey === 'create') {
    return buildCreateCollectionTool({
      collectionSlug,
      description,
      overrideResponse,
      schema,
    })
  }
  if (toolKey === 'update') {
    return buildUpdateCollectionTool({
      collectionSlug,
      description,
      overrideResponse,
      schema,
    })
  }
  if (toolKey === 'delete') {
    return buildDeleteCollectionTool({ collectionSlug, description, overrideResponse })
  }
  throw new Error(`Unknown collection built-in tool key: ${toolKey}`)
}

const buildGlobalBuiltinTool = ({
  configSchema,
  globalPluginConfig,
  globalSlug,
  key,
  req,
  toolPluginConfig: _toolPluginConfig,
}: {
  configSchema: JsonSchemaObject
  globalPluginConfig?: {
    description?: string
    overrideResponse?: MCPResponseOverride
  }
  globalSlug: string
  key: string
  req: PayloadRequest
  toolPluginConfig?: MCPGlobalToolEntry
}): GlobalTool => {
  const toolPluginConfig =
    _toolPluginConfig && typeof _toolPluginConfig === 'object' ? _toolPluginConfig : undefined

  const description = toolPluginConfig?.description ?? globalPluginConfig?.description
  const overrideResponse =
    toolPluginConfig?.overrideResponse ?? globalPluginConfig?.overrideResponse

  const rawSchema = configSchema.definitions?.[globalSlug]
  const virtualFieldNames = getGlobalVirtualFieldNames(req.payload.config, globalSlug)
  const schema = rawSchema
    ? removeVirtualFieldsFromSchema(
        JSON.parse(JSON.stringify(rawSchema)) as JsonSchemaObject,
        virtualFieldNames,
      )
    : ({ type: 'object', properties: {} } as JsonSchemaObject)

  if (key === 'find') {
    return buildFindGlobalTool({ description, globalSlug, overrideResponse })
  }
  if (key === 'update') {
    return buildUpdateGlobalTool({
      description,
      globalSlug,
      overrideResponse,
      schema,
    })
  }
  throw new Error(`Unknown global built-in tool key: ${key}`)
}
