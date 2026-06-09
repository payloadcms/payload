import { McpServer, type ServerContext } from '@modelcontextprotocol/server'
import { APIError, entityToStandaloneJSONSchema, type PayloadRequest } from 'payload'

import type {
  AuthorizedMCP,
  JsonSchemaType,
  MCPResponseOverride,
  MCPToolResponse,
  SanitizedMCPPluginConfig,
} from '../types.js'
import type { RuntimeTool } from './runtimeTools.js'

import { runtimeTools } from './runtimeTools.js'

import { toCamelCase } from '../utils/camelCase.js'
import { getLogger } from '../utils/getLogger.js'
import {
  getCollectionVirtualFieldNames,
  getGlobalVirtualFieldNames,
} from '../utils/getVirtualFieldNames.js'
import { removeVirtualFieldsFromSchema } from '../utils/schemaConversion/removeVirtualFieldsFromSchema.js'
import { toStandardSchema } from '../utils/toStandardSchema.js'

/** Live MCP registrations keyed by `<item.type>:<name>`, so items can be removed on reconcile. */
export type ItemRegistry = Map<string, { remove: () => void }>

/** `findPosts`, `updateSiteSettings` — auto-prefixed wire name for collection/global tools. */
const wireName = (key: string, slug: string): string => {
  const camel = toCamelCase(slug)
  return `${key}${camel.charAt(0).toUpperCase()}${camel.slice(1)}`
}

/**
 * Transport-agnostic core: builds a fresh `McpServer`, registers every authorized
 * item, and returns it alongside the registry of registrations. The caller picks a
 * transport and calls `server.connect(transport)`.
 *
 * `req` is the request context handlers see. For HTTP it's the live
 * `PayloadRequest` from the incoming request; for stdio it's built via `createLocalReq`.
 */
export const buildMcpServer = ({
  authorizedMCP,
  pluginConfig,
  req,
}: {
  authorizedMCP: AuthorizedMCP
  pluginConfig: SanitizedMCPPluginConfig
  req: PayloadRequest
}): { registry: ItemRegistry; server: McpServer } => {
  const serverOptions = pluginConfig.mcp?.serverOptions || {}
  const server = new McpServer(
    { name: 'Payload MCP Server', version: '1.0.0', ...serverOptions.serverInfo },
    serverOptions.options,
  )

  const registry = registerItems({ authorizedMCP, req, server })
  return { registry, server }
}

/**
 * Run `mutate` while collapsing the per-tool `tools/list_changed` notifications
 * the SDK emits on every `registerTool`/`remove` into a single notification at
 * the end.
 *
 * Without this, reconciling N tools emits ~2N notifications (one per remove plus
 * one per re-register). A connected client answers each one with a `tools/list`,
 * so a full rebuild triggers a flood of re-list requests that overloads the dev
 * server. Batching makes a rebuild behave like adding a single tool: one
 * notification, one re-list.
 */
const withBatchedToolListChanged = (server: McpServer, mutate: () => void): void => {
  const emitToolListChanged = server.sendToolListChanged
  // Suppress the SDK's per-tool emits (incl. the internal ones fired from
  // registerTool/remove) for the duration of the rebuild...
  server.sendToolListChanged = () => {}
  try {
    mutate()
  } finally {
    server.sendToolListChanged = emitToolListChanged
  }
  // ...then notify the client exactly once.
  server.sendToolListChanged()
}

/**
 * Rebuild a live server's items after a config change (HMR) and notify the client
 * to re-list. The rebuild is wrapped so the client receives a single
 * `tools/list_changed` rather than one per tool — see {@link withBatchedToolListChanged}.
 */
export const reconcileItems = ({
  authorizedMCP,
  registry,
  req,
  server,
}: {
  authorizedMCP: AuthorizedMCP
  registry: ItemRegistry
  req: PayloadRequest
  server: McpServer
}): ItemRegistry => {
  let next: ItemRegistry = new Map()
  withBatchedToolListChanged(server, () => {
    for (const registration of registry.values()) {
      registration.remove()
    }
    registry.clear()
    next = registerItems({ authorizedMCP, req, server })
  })
  return next
}

/**
 * Register a single runtime tool on a server. Returns the registration so the
 * caller can track it in an `ItemRegistry` and remove it later. Used both when
 * building a server (so new/reconciled servers include runtime tools) and when
 * adding a tool to already-live sessions.
 */
export const registerRuntimeToolOnServer = ({
  req,
  server,
  tool,
}: {
  req: PayloadRequest
  server: McpServer
  tool: RuntimeTool
}): { remove: () => void } =>
  server.registerTool(
    tool.name,
    {
      description: tool.description ?? `Runtime tool "${tool.name}".`,
      // An empty-object schema gives the `(input, ctx)` callback signature and
      // advertises a no-argument tool.
      inputSchema: toStandardSchema({ properties: {}, type: 'object' }),
      title: tool.title,
    },
    async (input: unknown, ctx: ServerContext) => {
      const response = await tool.handler({
        input: (input ?? {}) as Record<string, unknown>,
        req,
        serverContext: ctx,
      })
      const { doc: _doc, ...rest } = response
      return rest
    },
  )

const registerItems = ({
  authorizedMCP,
  req,
  server,
}: {
  authorizedMCP: AuthorizedMCP
  req: PayloadRequest
  server: McpServer
}): ItemRegistry => {
  const registry: ItemRegistry = new Map()
  const logger = getLogger({ payload: req.payload })

  const finalizeToolResponse = (
    response: MCPToolResponse,
    overrideResponse?: MCPResponseOverride,
  ): MCPToolResponse => {
    const overridden = overrideResponse?.(response, response.doc ?? {}, req) ?? response
    const { doc: _doc, ...rest } = overridden
    return rest
  }

  try {
    for (const item of authorizedMCP.items) {
      switch (item.type) {
        case 'collectionTool': {
          const tool = item.tool
          const name = wireName(item.key, item.collectionSlug)
          let inputSchema = tool.input
          if (typeof inputSchema === 'function') {
            const collection = req.payload.collections[item.collectionSlug]?.config
            if (!collection) {
              throw new APIError(
                `Collection schema not found for slug: ${item.collectionSlug}`,
                500,
              )
            }
            const collectionSchema = removeVirtualFieldsFromSchema(
              entityToStandaloneJSONSchema({
                config: req.payload.config,
                defaultIDType: req.payload.db.defaultIDType,
                entity: collection,
                i18n: req.i18n,
              }) as unknown as JsonSchemaType,
              getCollectionVirtualFieldNames(req.payload.config, item.collectionSlug),
            )
            inputSchema = inputSchema({ collectionSchema })
          }
          const registration = server.registerTool(
            name,
            {
              description: tool.description,
              inputSchema: inputSchema ? toStandardSchema(inputSchema) : undefined,
            },
            async (input: unknown, ctx: ServerContext) =>
              finalizeToolResponse(
                await tool.handler({
                  authorizedMCP,
                  collectionSlug: item.collectionSlug,
                  input: (input ?? {}) as Record<string, unknown>,
                  req,
                  serverContext: ctx,
                }),
                tool.overrideResponse,
              ),
          )
          registry.set(`collectionTool:${name}`, registration)
          logger.info(`✅ Tool: ${name} Registered.`)
          break
        }
        case 'globalTool': {
          const tool = item.tool
          const name = wireName(item.key, item.globalSlug)
          let inputSchema = tool.input
          if (typeof inputSchema === 'function') {
            const globalEntity = req.payload.config.globals.find(
              (globalConfig) => globalConfig.slug === item.globalSlug,
            )
            if (!globalEntity) {
              throw new APIError(`Global schema not found for slug: ${item.globalSlug}`, 500)
            }
            const globalSchema = removeVirtualFieldsFromSchema(
              entityToStandaloneJSONSchema({
                config: req.payload.config,
                defaultIDType: req.payload.db.defaultIDType,
                entity: globalEntity,
                i18n: req.i18n,
              }) as unknown as JsonSchemaType,
              getGlobalVirtualFieldNames(req.payload.config, item.globalSlug),
            )

            inputSchema = inputSchema({ globalSchema })
          }
          const registration = server.registerTool(
            name,
            {
              description: tool.description,
              inputSchema: inputSchema ? toStandardSchema(inputSchema) : undefined,
            },
            async (input: unknown, ctx: ServerContext) =>
              finalizeToolResponse(
                await tool.handler({
                  authorizedMCP,
                  globalSlug: item.globalSlug,
                  input: (input ?? {}) as Record<string, unknown>,
                  req,
                  serverContext: ctx,
                }),
                tool.overrideResponse,
              ),
          )
          registry.set(`globalTool:${name}`, registration)
          logger.info(`✅ Tool: ${name} Registered.`)
          break
        }
        case 'prompt': {
          const prompt = item.prompt
          const registration = server.registerPrompt(
            item.key,
            {
              argsSchema: prompt.argsSchema ? toStandardSchema(prompt.argsSchema) : undefined,
              description: prompt.description,
              title: prompt.title,
            },
            async (input: unknown, ctx: ServerContext) =>
              prompt.handler({
                input: (input ?? {}) as Record<string, unknown>,
                req,
                serverContext: ctx,
              }),
          )
          registry.set(`prompt:${item.key}`, registration)
          logger.info(`✅ Prompt: ${prompt.title} Registered.`)
          break
        }
        case 'resource': {
          const resource = item.resource
          const registration = server.registerResource(
            item.key,
            // @ts-expect-error - Overload type ambiguity (string OR ResourceTemplate is valid)
            resource.uri,
            {
              description: resource.description,
              mimeType: resource.mimeType,
              title: resource.title,
            },
            // Static URIs call (uri, ctx); ResourceTemplates call (uri, params, ctx).
            // The rest-params shape lets us collect either signature uniformly.
            async (...sdkArgs: unknown[]) => {
              const ctx = sdkArgs[sdkArgs.length - 1] as ServerContext
              const uri = sdkArgs[0] as URL
              const params = (sdkArgs.length > 2 ? sdkArgs[1] : {}) as Record<string, string>
              return resource.handler({ params, req, serverContext: ctx, uri })
            },
          )
          registry.set(`resource:${item.key}`, registration)
          logger.info(`✅ Resource: ${resource.title} Registered.`)
          break
        }
        case 'tool': {
          const tool = item.tool
          const registration = server.registerTool(
            item.key,
            {
              description: tool.description,
              inputSchema: tool.input ? toStandardSchema(tool.input) : undefined,
            },
            async (input: unknown, ctx: ServerContext) =>
              finalizeToolResponse(
                await tool.handler({
                  authorizedMCP,
                  input: (input ?? {}) as Record<string, unknown>,
                  req,
                  serverContext: ctx,
                }),
                tool.overrideResponse,
              ),
          )
          registry.set(`tool:${item.key}`, registration)
          logger.info(`✅ Tool: ${item.key} Registered.`)
          break
        }
      }
    }

    // Re-apply runtime tools so every server built afterwards (new sessions and
    // post-HMR reconciles) includes them, not just the session they were added on.
    for (const tool of runtimeTools.values()) {
      const registration = registerRuntimeToolOnServer({ req, server, tool })
      registry.set(`runtimeTool:${tool.name}`, registration)
      logger.info(`✅ Runtime tool: ${tool.name} Registered.`)
    }
  } catch (error) {
    throw new APIError(`Error initializing MCP handler: ${String(error)}`, 500)
  }

  return registry
}
