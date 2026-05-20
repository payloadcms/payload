import {
  fromJsonSchema,
  McpServer,
  type ServerContext,
  WebStandardStreamableHTTPServerTransport,
} from '@modelcontextprotocol/server'
import { APIError, AuthenticationError, configToJSONSchema, type PayloadHandler } from 'payload'

import type { JsonSchemaType, MCPResponseOverride, MCPToolResponse } from '../types.js'

import { toCamelCase } from '../utils/camelCase.js'
import { getLogger } from '../utils/getLogger.js'
import { getPluginConfig } from '../utils/getPluginConfig.js'
import {
  getCollectionVirtualFieldNames,
  getGlobalVirtualFieldNames,
} from '../utils/getVirtualFieldNames.js'
import { removeVirtualFieldsFromSchema } from '../utils/schemaConversion/removeVirtualFieldsFromSchema.js'
import { getAuthorizedMCP } from './access.js'

/** `findPosts`, `updateSiteSettings` — auto-prefixed wire name for collection/global tools. */
const wireName = (key: string, slug: string): string => {
  const camel = toCamelCase(slug)
  return `${key}${camel.charAt(0).toUpperCase()}${camel.slice(1)}`
}

export const mcpEndpoint: PayloadHandler = async (req) => {
  if (!req.url) {
    throw new AuthenticationError()
  }

  req.payloadAPI = 'MCP' as const

  const pluginConfig = getPluginConfig({ config: req.payload.config })
  const authorizedMCP = await getAuthorizedMCP({ req })
  const serverOptions = pluginConfig.mcp?.serverOptions || {}

  const server = new McpServer(
    { name: 'Payload MCP Server', version: '1.0.0', ...serverOptions.serverInfo },
    serverOptions.options,
  )

  const logger = getLogger({ payload: req.payload })

  /**
   * Wrap a tool handler's response with the tool's `overrideResponse`, then
   * strip the internal `doc` field so it doesn't leak onto the wire.
   */
  const finalizeToolResponse = (
    response: MCPToolResponse,
    overrideResponse?: MCPResponseOverride,
  ): MCPToolResponse => {
    const overridden = overrideResponse?.(response, response.doc ?? {}, req) ?? response
    const { doc: _doc, ...rest } = overridden
    return rest
  }

  const configSchema = configToJSONSchema(
    req.payload.config,
    req.payload.db.defaultIDType,
    req.i18n,
    { forceInlineBlocks: true },
  ) as JsonSchemaType

  try {
    for (const item of authorizedMCP.items) {
      switch (item.type) {
        case 'collectionTool': {
          const tool = item.tool
          const name = wireName(item.key, item.collectionSlug)
          let inputSchema = tool.input
          if (typeof inputSchema === 'function') {
            const raw = configSchema.definitions?.[item.collectionSlug]
            if (!raw) {
              throw new APIError(
                `Collection schema not found for slug: ${item.collectionSlug}`,
                500,
              )
            }
            const collectionSchema = removeVirtualFieldsFromSchema(
              JSON.parse(JSON.stringify(raw)) as JsonSchemaType,
              getCollectionVirtualFieldNames(req.payload.config, item.collectionSlug),
            )
            inputSchema = inputSchema({ collectionSchema })
          }
          server.registerTool(
            name,
            {
              description: tool.description,
              inputSchema: inputSchema ? fromJsonSchema(inputSchema) : undefined,
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
          logger.info(`✅ Tool: ${name} Registered.`)
          break
        }
        case 'globalTool': {
          const tool = item.tool
          const name = wireName(item.key, item.globalSlug)
          let inputSchema = tool.input
          if (typeof inputSchema === 'function') {
            const raw = configSchema.definitions?.[item.globalSlug]
            if (!raw) {
              throw new APIError(`Global schema not found for slug: ${item.globalSlug}`, 500)
            }
            const globalSchema = removeVirtualFieldsFromSchema(
              JSON.parse(JSON.stringify(raw)) as JsonSchemaType,
              getGlobalVirtualFieldNames(req.payload.config, item.globalSlug),
            )

            inputSchema = inputSchema({ globalSchema })
          }
          server.registerTool(
            name,
            {
              description: tool.description,
              inputSchema: inputSchema ? fromJsonSchema(inputSchema) : undefined,
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
          logger.info(`✅ Tool: ${name} Registered.`)
          break
        }
        case 'prompt': {
          const prompt = item.prompt
          server.registerPrompt(
            item.key,
            {
              argsSchema: prompt.argsSchema ? fromJsonSchema(prompt.argsSchema) : undefined,
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
          logger.info(`✅ Prompt: ${prompt.title} Registered.`)
          break
        }
        case 'resource': {
          const resource = item.resource
          server.registerResource(
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
          logger.info(`✅ Resource: ${resource.title} Registered.`)
          break
        }
        case 'tool': {
          const tool = item.tool
          server.registerTool(
            item.key,
            {
              description: tool.description,
              inputSchema: tool.input ? fromJsonSchema(tool.input) : undefined,
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
          logger.info(`✅ Tool: ${item.key} Registered.`)
          break
        }
      }
    }
  } catch (error) {
    throw new APIError(`Error initializing MCP handler: ${String(error)}`, 500)
  }

  const transport = new WebStandardStreamableHTTPServerTransport({
    enableJsonResponse: true,
    sessionIdGenerator: undefined, // stateless mode
  })

  await server.connect(transport)

  const mcpRequest = new Request(req.url, {
    body: req.body,
    duplex: 'half',
    headers: req.headers,
    method: req.method,
  } as { duplex: 'half' } & RequestInit)

  return await transport.handleRequest(mcpRequest)
}
