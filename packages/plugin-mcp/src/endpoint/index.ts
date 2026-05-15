import {
  fromJsonSchema,
  McpServer,
  WebStandardStreamableHTTPServerTransport,
} from '@modelcontextprotocol/server'
import { APIError, AuthenticationError, type PayloadHandler, type PayloadRequest } from 'payload'

import type {
  AuthorizedMCP,
  CollectionTool,
  GlobalTool,
  MCPCollectionToolContext,
  MCPGlobalToolContext,
  MCPToolContext,
  Tool,
} from '../types.js'

import { toCamelCase } from '../utils/camelCase.js'
import { getLogger } from '../utils/getLogger.js'
import { getPluginConfig } from '../utils/getPluginConfig.js'
import { getAuthorizedMCP } from './access.js'

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

  try {
    for (const [slug, tools] of Object.entries(authorizedMCP.collections)) {
      for (const [key, tool] of Object.entries(tools)) {
        registerCollectionTool({ slug, authorizedMCP, key, req, server, tool })
      }
    }

    for (const [slug, tools] of Object.entries(authorizedMCP.globals)) {
      for (const [key, tool] of Object.entries(tools)) {
        registerGlobalTool({ slug, key, authorizedMCP, req, server, tool })
      }
    }

    for (const [key, tool] of Object.entries(authorizedMCP.tools)) {
      registerTopLevelTool({ key, authorizedMCP, req, server, tool })
    }

    for (const [name, prompt] of Object.entries(authorizedMCP.prompts)) {
      server.registerPrompt(
        name,
        {
          argsSchema: fromJsonSchema(
            (prompt.argsSchema ?? { type: 'object', properties: {} }) as Parameters<typeof fromJsonSchema>[0],
          ),
          description: prompt.description,
          title: prompt.title,
        },
        wrapHandlerWithReq(prompt.handler, req),
      )
      logger.info(`✅ Prompt: ${prompt.title} Registered.`)
    }

    for (const [name, resource] of Object.entries(authorizedMCP.resources)) {
      server.registerResource(
        name,
        // @ts-expect-error - Overload type ambiguity (string OR ResourceTemplate is valid)
        resource.uri,
        {
          description: resource.description,
          mimeType: resource.mimeType,
          title: resource.title,
        },
        wrapHandlerWithReq(resource.handler, req),
      )
      logger.info(`✅ Resource: ${resource.title} Registered.`)
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

const registerCollectionTool = ({
  slug,
  key,
  authorizedMCP,
  req,
  server,
  tool,
}: {
  key: string
  authorizedMCP: AuthorizedMCP
  req: PayloadRequest
  server: McpServer
  slug: string
  tool: CollectionTool
}): void => {
  const toolName = getToolName(key, slug)
  server.registerTool(
    toolName,
    {
      description: tool.description,
      inputSchema: fromJsonSchema(
        (tool.input ?? { type: 'object', properties: {} }) as Parameters<typeof fromJsonSchema>[0],
      ),
    },
    async (rawParams: unknown, _extra: unknown) => {
      const ctx: MCPCollectionToolContext = {
        _extra,
        collectionSlug: slug,
        input: (rawParams ?? {}) as Record<string, unknown>,
        authorizedMCP,
        payload: req.payload,
        req,
      }
      return tool.handler(ctx)
    },
  )
  getLogger({ payload: req.payload }).info(`✅ Tool: ${toolName} Registered.`)
}

const registerGlobalTool = ({
  slug,
  key,
  authorizedMCP,
  req,
  server,
  tool,
}: {
  key: string
  authorizedMCP: AuthorizedMCP
  req: PayloadRequest
  server: McpServer
  slug: string
  tool: GlobalTool
}): void => {
  const toolName = getToolName(key, slug)
  server.registerTool(
    toolName,
    {
      description: tool.description,
      inputSchema: fromJsonSchema(
        (tool.input ?? { type: 'object', properties: {} }) as Parameters<typeof fromJsonSchema>[0],
      ),
    },
    async (rawParams: unknown, _extra: unknown) => {
      const ctx: MCPGlobalToolContext = {
        _extra,
        globalSlug: slug,
        input: (rawParams ?? {}) as Record<string, unknown>,
        authorizedMCP,
        payload: req.payload,
        req,
      }
      return tool.handler(ctx)
    },
  )
  getLogger({ payload: req.payload }).info(`✅ Tool: ${toolName} Registered.`)
}

const registerTopLevelTool = ({
  key,
  authorizedMCP,
  req,
  server,
  tool,
}: {
  key: string
  authorizedMCP: AuthorizedMCP
  req: PayloadRequest
  server: McpServer
  tool: Tool
}): void => {
  server.registerTool(
    key,
    {
      description: tool.description,
      inputSchema: fromJsonSchema(
        (tool.input ?? { type: 'object', properties: {} }) as Parameters<typeof fromJsonSchema>[0],
      ),
    },
    async (rawParams: unknown, _extra: unknown) => {
      const ctx: MCPToolContext = {
        _extra,
        input: (rawParams ?? {}) as Record<string, unknown>,
        authorizedMCP,
        payload: req.payload,
        req,
      }
      return tool.handler(ctx)
    },
  )
  getLogger({ payload: req.payload }).info(`✅ Tool: ${key} Registered.`)
}

const wrapHandlerWithReq = (handler: (...args: any[]) => any, req: PayloadRequest) => {
  return async (...args: any[]) => {
    const _extra = args[args.length - 1]
    const handlerArgs = args.slice(0, -1)
    return await handler(...handlerArgs, req, _extra)
  }
}

/**
 * Produces the name MCP clients see for a tool,
 * e.g. `findPosts` / `createPosts` / `sendPosts`, etc.
 *
 * @example
 *   getToolName('find', 'posts')         // 'findPosts'
 *   getToolName('update', 'site-settings') // 'updateSiteSettings'
 */
export const getToolName = (tool: string, slug: string): string => {
  const camel = toCamelCase(slug)
  return `${tool}${camel.charAt(0).toUpperCase()}${camel.slice(1)}`
}
