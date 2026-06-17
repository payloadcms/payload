import { McpServer, type ServerContext } from '@modelcontextprotocol/server'
import { APIError, type PayloadRequest } from 'payload'
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

  /**
   * Runs a collection/global tool call:
   * - reads `collectionSlug` / `globalSlug` from the input
   * - runs access control: errors if `authorizedMCP.items` has no entry for this tool + slug
   * - runs the tool handler and finalizes its response
   */
  const callEntityTool = async ({
    input,
    item,
    serverContext,
  }: {
    input: unknown
    item: CollectionMCPItem | GlobalMCPItem
    serverContext: ServerContext
  }): Promise<MCPToolResponse> => {
    const entity = item.type === 'collectionTool' ? 'collection' : 'global'
    const slugKey = item.type === 'collectionTool' ? 'collectionSlug' : 'globalSlug'
    const toolInput = (input ?? {}) as Record<string, unknown>
    const slug = toolInput[slugKey] as string | undefined

    if (!slug) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: "${item.mcpName}" requires ${slugKey}. Use getConfigInfo to inspect ${entity} slugs.`,
          },
        ],
        isError: true,
      }
    }

    const match = authorizedMCP.items.find(
      (candidate): candidate is CollectionMCPItem | GlobalMCPItem =>
        candidate.type === item.type &&
        candidate.mcpName === item.mcpName &&
        (candidate.type === 'collectionTool'
          ? candidate.collectionSlug === slug
          : candidate.type === 'globalTool' && candidate.globalSlug === slug),
    )

    if (!match) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: MCP access to "${item.mcpName}" is not enabled for ${entity} "${slug}"`,
          },
        ],
        isError: true,
      }
    }

    const handlerArgs = {
      authorizedMCP,
      input: toolInput,
      req,
      serverContext,
    }
    const response = await (match.type === 'collectionTool'
      ? match.tool.handler({ ...handlerArgs, collectionSlug: slug })
      : match.tool.handler({ ...handlerArgs, globalSlug: slug }))

    return finalizeToolResponse(response, match.tool.overrideResponse)
  }

  try {
    const registeredEntityTools = new Set<string>()

    for (const item of authorizedMCP.items) {
      switch (item.type) {
        case 'collectionTool':
        case 'globalTool': {
          if (registeredEntityTools.has(item.mcpName)) {
            break
          }
          registeredEntityTools.add(item.mcpName)

          const inputSchema = withSlugInput({
            name: item.type === 'collectionTool' ? 'collectionSlug' : 'globalSlug',
            input: item.tool.input,
          })

          server.registerTool(
            item.mcpName,
            {
              description: item.tool.description,
              inputSchema: toStandardSchema(inputSchema),
            },
            async (input: unknown, ctx: ServerContext) =>
              callEntityTool({ input, item, serverContext: ctx }),
          )
          logger.info(`✅ Tool: ${item.mcpName} Registered.`)
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
