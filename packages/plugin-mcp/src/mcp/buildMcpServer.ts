import type { PayloadRequest } from 'payload'

import { McpServer, type ServerContext } from '@modelcontextprotocol/server'
import { APIError, strictObject, z } from 'payload'

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
 * Serving-entry-agnostic core: registers every authorized MCP item onto a fresh
 * `McpServer` and returns it. The HTTP and stdio entry point callers provide fresh
 * instances from this builder while they own the transport and protocol-era
 * decision.
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
  z.config(z.locales.en())

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
  const finalizeToolResponse = async ({
    input,
    overrideResponse,
    response,
    toolName,
  }: {
    input: unknown
    overrideResponse?: MCPResponseOverride
    response: MCPToolResponse
    toolName: string
  }): Promise<MCPToolResponse> => {
    let overridden = overrideResponse?.(response, response.doc ?? {}, req) ?? response
    for (const hook of pluginConfig.hooks?.afterToolCall ?? []) {
      overridden = await hook({ input, req, response: overridden, toolName })
    }
    const { doc: _doc, ...rest } = overridden
    return rest
  }

  /**
   * Runs a collection/global tool call:
   * - reads `slug` from the input
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
    const toolInput = (input ?? {}) as Record<string, unknown>
    const slug = toolInput.slug as string | undefined

    if (!slug) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: "${item.mcpName}" requires slug. Use getConfigInfo to inspect ${entity} slugs.`,
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
      ? match.tool.handler({ ...handlerArgs, slug })
      : match.tool.handler({ ...handlerArgs, slug }))

    return finalizeToolResponse({
      input: toolInput,
      overrideResponse: match.tool.overrideResponse,
      response,
      toolName: match.mcpName,
    })
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

          const inputSchema = withSlugInput({ input: item.tool.input })

          server.registerTool(
            item.mcpName,
            {
              annotations: item.tool.annotations,
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
              annotations: tool.annotations,
              description: tool.description,
              inputSchema: tool.input ? toStandardSchema(tool.input) : undefined,
            },
            async (input: unknown, ctx: ServerContext) => {
              const toolInput = (input ?? {}) as Record<string, unknown>
              const response = await tool.handler({
                authorizedMCP,
                input: toolInput,
                req,
                serverContext: ctx,
              })
              return finalizeToolResponse({
                input: toolInput,
                overrideResponse: tool.overrideResponse,
                response,
                toolName: item.mcpName,
              })
            },
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

const withSlugInput = ({ input }: { input?: ToolInputSchema }): ToolInputSchema => {
  const description = 'The target slug.'
  const slugSchema = z.string().check(z.describe(description))

  if (!input) {
    return strictObject({ slug: slugSchema }) as unknown as ToolInputSchema
  }

  if (typeof input === 'object' && input !== null && '~standard' in input) {
    const schema = input['~standard'].jsonSchema.input({ target: 'draft-2020-12' })
    const properties = schema.properties as Record<string, unknown> | undefined

    if (properties?.slug) {
      return input
    }

    return addSlugToJSONSchema({ description, schema: schema as JsonSchemaType })
  }

  return addSlugToJSONSchema({ description, schema: input })
}

const addSlugToJSONSchema = ({
  description,
  schema,
}: {
  description: string
  schema: JsonSchemaType
}): JsonSchemaType => {
  const objectSchema = schema as {
    properties?: Record<string, JsonSchemaType>
    required?: string[]
  } & JsonSchemaType

  return {
    ...objectSchema,
    type: 'object',
    properties: {
      ...objectSchema.properties,
      slug: {
        type: 'string',
        description,
      },
    },
    required: Array.from(new Set(['slug', ...(objectSchema.required ?? [])])),
  }
}
