import { McpServer, type ServerContext } from '@modelcontextprotocol/server'
import { APIError, type CollectionSlug, type GlobalSlug, type PayloadRequest } from 'payload'
import { z } from 'zod'

import type {
  AuthorizedMCP,
  CollectionMCPItem,
  GlobalMCPItem,
  JsonSchemaType,
  MCPResponseOverride,
  MCPToolResponse,
  SanitizedMCPPluginConfig,
  ToolInputSchema,
} from '../types.js'

import { getLogger } from '../utils/getLogger.js'
import { toStandardSchema } from '../utils/toStandardSchema.js'

/**
 * Transport-agnostic core: registers every authorized MCP item onto a fresh
 * `McpServer` and returns it. The caller is responsible for picking a transport
 * (`WebStandardStreamableHTTPServerTransport`, `StdioServerTransport`, …) and
 * calling `server.connect(transport)`.
 *
 * `req` is the request context handlers see. For HTTP it's the live
 * `PayloadRequest` derived from the incoming HTTP request; for stdio it's a
 * synthesized one built via `createLocalReq`.
 */
export const buildMcpServer = ({
  authorizedMCP,
  pluginConfig,
  req,
}: {
  authorizedMCP: AuthorizedMCP
  pluginConfig: SanitizedMCPPluginConfig
  req: PayloadRequest
}): McpServer => {
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

  try {
    const registeredCollectionTools = new Set<string>()
    const registeredGlobalTools = new Set<string>()

    for (const item of authorizedMCP.items) {
      switch (item.type) {
        case 'collectionTool': {
          if (registeredCollectionTools.has(item.mcpName)) {
            break
          }
          registeredCollectionTools.add(item.mcpName)

          const tool = item.tool
          const mcpName = item.mcpName
          const inputSchema = withSlugInput({
            name: 'collectionSlug',
            input: tool.input,
          })

          server.registerTool(
            mcpName,
            {
              description: tool.description,
              inputSchema: toStandardSchema(inputSchema),
            },
            async (input: unknown, ctx: ServerContext) =>
              finalizeCollectionToolResponse({
                authorizedMCP,
                input,
                item,
                req,
                serverContext: ctx,
              }),
          )
          logger.info(`✅ Tool: ${mcpName} Registered.`)
          break
        }
        case 'globalTool': {
          if (registeredGlobalTools.has(item.mcpName)) {
            break
          }
          registeredGlobalTools.add(item.mcpName)

          const tool = item.tool
          const mcpName = item.mcpName
          const inputSchema = withSlugInput({
            name: 'globalSlug',
            input: tool.input,
          })

          server.registerTool(
            mcpName,
            {
              description: tool.description,
              inputSchema: toStandardSchema(inputSchema),
            },
            async (input: unknown, ctx: ServerContext) =>
              finalizeGlobalToolResponse({
                authorizedMCP,
                input,
                item,
                req,
                serverContext: ctx,
              }),
          )
          logger.info(`✅ Tool: ${mcpName} Registered.`)
          break
        }
        case 'prompt': {
          const prompt = item.prompt
          server.registerPrompt(
            item.mcpName,
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
          logger.info(`✅ Prompt: ${prompt.title} Registered.`)
          break
        }
        case 'resource': {
          const resource = item.resource
          server.registerResource(
            item.mcpName,
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
            item.mcpName,
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
          logger.info(`✅ Tool: ${item.mcpName} Registered.`)
          break
        }
      }
    }
  } catch (error) {
    throw new APIError(`Error initializing MCP handler: ${String(error)}`, 500)
  }

  return server
}

const withSlugInput = ({
  name,
  input,
}: {
  input?: ToolInputSchema
  name: 'collectionSlug' | 'globalSlug'
}): ToolInputSchema => {
  const description = name === 'collectionSlug' ? 'The collection slug' : 'The global slug'
  const slugSchema = z.string().describe(description)

  if (!input) {
    return z.object({ [name]: slugSchema })
  }

  if (input instanceof z.ZodObject) {
    return input.extend({ [name]: slugSchema })
  }

  const schema = input as {
    properties?: Record<string, JsonSchemaType>
    required?: string[]
  } & JsonSchemaType

  return {
    ...schema,
    type: 'object',
    properties: {
      ...schema.properties,
      [name]: {
        type: 'string',
        description,
      },
    },
    required: Array.from(new Set([name, ...(schema.required ?? [])])),
  }
}

/**
 * Generic collection tools are registered once. This checks `input.collectionSlug`
 * against the API key's allowed collections before calling the tool handler.
 */
const finalizeCollectionToolResponse = async ({
  authorizedMCP,
  input,
  item,
  req,
  serverContext,
}: {
  authorizedMCP: AuthorizedMCP
  input: unknown
  item: CollectionMCPItem
  req: PayloadRequest
  serverContext: ServerContext
}): Promise<MCPToolResponse> => {
  const toolInput = (input ?? {}) as Record<string, unknown>
  const collectionSlug = toolInput.collectionSlug as CollectionSlug | undefined
  const mcpName = item.mcpName

  if (!collectionSlug) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: "${mcpName}" requires collectionSlug. Use getConfigInfo to inspect collection slugs.`,
        },
      ],
      isError: true,
    }
  }

  const itemForCollection = collectionSlug
    ? authorizedMCP.items.find(
        (candidate): candidate is CollectionMCPItem =>
          candidate.type === 'collectionTool' &&
          candidate.mcpName === mcpName &&
          candidate.collectionSlug === collectionSlug,
      )
    : item

  if (!itemForCollection) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: MCP access to "${mcpName}" is not enabled for collection "${collectionSlug}"`,
        },
      ],
      isError: true,
    }
  }

  const tool = itemForCollection.tool
  const response = await tool.handler({
    authorizedMCP,
    collectionSlug,
    input: toolInput,
    req,
    serverContext,
  })
  const overridden = tool.overrideResponse?.(response, response.doc ?? {}, req) ?? response
  const { doc: _doc, ...rest } = overridden
  return rest
}

const finalizeGlobalToolResponse = async ({
  authorizedMCP,
  input,
  item,
  req,
  serverContext,
}: {
  authorizedMCP: AuthorizedMCP
  input: unknown
  item: GlobalMCPItem
  req: PayloadRequest
  serverContext: ServerContext
}): Promise<MCPToolResponse> => {
  const toolInput = (input ?? {}) as Record<string, unknown>
  const globalSlug = toolInput.globalSlug as GlobalSlug | undefined
  const mcpName = item.mcpName

  if (!globalSlug) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: "${mcpName}" requires globalSlug. Use getConfigInfo to inspect global slugs.`,
        },
      ],
      isError: true,
    }
  }

  const itemForGlobal = globalSlug
    ? authorizedMCP.items.find(
        (candidate): candidate is GlobalMCPItem =>
          candidate.type === 'globalTool' &&
          candidate.mcpName === mcpName &&
          candidate.globalSlug === globalSlug,
      )
    : item

  if (!itemForGlobal) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: MCP access to "${mcpName}" is not enabled for global "${globalSlug}"`,
        },
      ],
      isError: true,
    }
  }

  const tool = itemForGlobal.tool
  const response = await tool.handler({
    authorizedMCP,
    globalSlug,
    input: toolInput,
    req,
    serverContext,
  })
  const overridden = tool.overrideResponse?.(response, response.doc ?? {}, req) ?? response
  const { doc: _doc, ...rest } = overridden
  return rest
}
