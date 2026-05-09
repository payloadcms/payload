import {
  fromJsonSchema,
  McpServer,
  WebStandardStreamableHTTPServerTransport,
} from '@modelcontextprotocol/server'
import { APIError, configToJSONSchema, type PayloadRequest, type TypedUser } from 'payload'

import type { JsonSchemaObject, MCPAccessSettings, MCPPluginConfig } from '../types.js'

import { toCamelCase } from '../utils/camelCase.js'
import { getEnabledSlugs } from '../utils/getEnabledSlugs.js'
import { getLogger } from '../utils/getLogger.js'
import {
  getCollectionVirtualFieldNames,
  getGlobalVirtualFieldNames,
} from '../utils/getVirtualFieldNames.js'
import { removeVirtualFieldsFromSchema } from '../utils/schemaConversion/removeVirtualFieldsFromSchema.js'
import { registerTool } from './registerTool.js'

// Tools
import { findGlobalTool } from './tools/global/find.js'
import { updateGlobalTool } from './tools/global/update.js'
import { createResourceTool } from './tools/resource/create.js'
import { deleteResourceTool } from './tools/resource/delete.js'
import { findResourceTool } from './tools/resource/find.js'
import { updateResourceTool } from './tools/resource/update.js'

// Experimental Tools
/**
 * @experimental These tools are experimental and may change or be removed in the future.
 */
import { authTool } from './tools/auth/auth.js'
import { forgotPasswordTool } from './tools/auth/forgotPassword.js'
import { loginTool } from './tools/auth/login.js'
import { resetPasswordTool } from './tools/auth/resetPassword.js'
import { unlockTool } from './tools/auth/unlock.js'
import { verifyTool } from './tools/auth/verify.js'

export const getMCPHandler = async (
  pluginOptions: MCPPluginConfig,
  mcpAccessSettings: MCPAccessSettings,
  req: PayloadRequest,
): Promise<(request: Request) => Promise<Response>> => {
  const { payload } = req
  const logger = getLogger({ payload })
  const configSchema = configToJSONSchema(payload.config, payload.db.defaultIDType, req.i18n, {
    forceInlineBlocks: true,
  })

  // Handler wrapper that injects req before the _extra argument
  const wrapHandler = (handler: (...args: any[]) => any) => {
    return async (...args: any[]) => {
      const _extra = args[args.length - 1]
      const handlerArgs = args.slice(0, -1)
      return await handler(...handlerArgs, req, _extra)
    }
  }

  const payloadToolHandler = (
    handler: NonNullable<NonNullable<MCPPluginConfig['mcp']>['tools']>[number]['handler'],
  ) => wrapHandler(handler)

  const payloadPromptHandler = (
    handler: NonNullable<NonNullable<MCPPluginConfig['mcp']>['prompts']>[number]['handler'],
  ) => wrapHandler(handler)

  const payloadResourceHandler = (
    handler: NonNullable<NonNullable<MCPPluginConfig['mcp']>['resources']>[number]['handler'],
  ) => wrapHandler(handler)

  // User
  const user = mcpAccessSettings.user

  // MCP Server and Handler Options
  const MCPOptions = pluginOptions.mcp || {}
  const customMCPTools = MCPOptions.tools || []
  const customMCPPrompts = MCPOptions.prompts || []
  const customMCPResources = MCPOptions.resources || []
  const serverOptions = MCPOptions.serverOptions || {}

  // Experimental MCP Tool Requirements
  const isDevelopment = process.env.NODE_ENV === 'development'
  const experimentalTools: NonNullable<MCPPluginConfig['experimental']>['tools'] =
    pluginOptions?.experimental?.tools || {}
  const collectionsPluginConfig = pluginOptions.collections || {}
  const globalsPluginConfig = pluginOptions.globals || {}

  const server = new McpServer(
    serverOptions.serverInfo ?? { name: 'Payload MCP Server', version: '1.0.0' },
    serverOptions.instructions !== undefined
      ? { instructions: serverOptions.instructions }
      : undefined,
  )

  try {
    {
      // Get enabled collections
      const enabledCollectionSlugs = getEnabledSlugs(collectionsPluginConfig, 'collection')

      // Collection Operation Tools
      enabledCollectionSlugs.forEach((enabledCollectionSlug) => {
        try {
          const rawSchema = configSchema.definitions?.[enabledCollectionSlug] as JsonSchemaObject

          const virtualFieldNames = getCollectionVirtualFieldNames(
            payload.config,
            enabledCollectionSlug,
          )
          const schema = removeVirtualFieldsFromSchema(
            JSON.parse(JSON.stringify(rawSchema)) as JsonSchemaObject,
            virtualFieldNames,
          )

          const toolCapabilities = mcpAccessSettings?.[
            `${toCamelCase(enabledCollectionSlug)}`
          ] as Record<string, unknown>
          const allowCreate: boolean | undefined = toolCapabilities?.create as boolean
          const allowUpdate: boolean | undefined = toolCapabilities?.update as boolean
          const allowFind: boolean | undefined = toolCapabilities?.find as boolean
          const allowDelete: boolean | undefined = toolCapabilities?.delete as boolean

          if (allowCreate) {
            registerTool({
              isEnabled: allowCreate,
              payload,
              registrationFn: () =>
                createResourceTool(
                  server,
                  req,
                  user,
                  enabledCollectionSlug,
                  collectionsPluginConfig,
                  schema,
                ),
              toolType: `Create ${enabledCollectionSlug}`,
            })
          }
          if (allowUpdate) {
            registerTool({
              isEnabled: allowUpdate,
              payload,
              registrationFn: () =>
                updateResourceTool(
                  server,
                  req,
                  user,
                  enabledCollectionSlug,
                  collectionsPluginConfig,
                  schema,
                ),
              toolType: `Update ${enabledCollectionSlug}`,
            })
          }
          if (allowFind) {
            registerTool({
              isEnabled: allowFind,
              payload,
              registrationFn: () =>
                findResourceTool(server, req, user, enabledCollectionSlug, collectionsPluginConfig),
              toolType: `Find ${enabledCollectionSlug}`,
            })
          }
          if (allowDelete) {
            registerTool({
              isEnabled: allowDelete,
              payload,
              registrationFn: () =>
                deleteResourceTool(
                  server,
                  req,
                  user,
                  enabledCollectionSlug,
                  collectionsPluginConfig,
                ),
              toolType: `Delete ${enabledCollectionSlug}`,
            })
          }
        } catch (error) {
          throw new APIError(
            `Error registering tools for collection ${enabledCollectionSlug}: ${String(error)}`,
            500,
          )
        }
      })

      // Global Operation Tools
      const enabledGlobalSlugs = getEnabledSlugs(globalsPluginConfig, 'global')

      enabledGlobalSlugs.forEach((enabledGlobalSlug) => {
        try {
          const rawSchema = configSchema.definitions?.[enabledGlobalSlug] as JsonSchemaObject

          const virtualFieldNames = getGlobalVirtualFieldNames(payload.config, enabledGlobalSlug)
          const schema = removeVirtualFieldsFromSchema(
            JSON.parse(JSON.stringify(rawSchema)) as JsonSchemaObject,
            virtualFieldNames,
          )

          const toolCapabilities = mcpAccessSettings?.[
            `${toCamelCase(enabledGlobalSlug)}`
          ] as Record<string, unknown>
          const allowFind: boolean | undefined = toolCapabilities?.['find'] as boolean
          const allowUpdate: boolean | undefined = toolCapabilities?.['update'] as boolean

          if (allowFind) {
            registerTool({
              isEnabled: allowFind,
              payload,
              registrationFn: () =>
                findGlobalTool(server, req, user, enabledGlobalSlug, globalsPluginConfig),
              toolType: `Find ${enabledGlobalSlug}`,
            })
          }
          if (allowUpdate) {
            registerTool({
              isEnabled: allowUpdate,
              payload,
              registrationFn: () =>
                updateGlobalTool(server, req, user, enabledGlobalSlug, globalsPluginConfig, schema),
              toolType: `Update ${enabledGlobalSlug}`,
            })
          }
        } catch (error) {
          throw new APIError(
            `Error registering tools for global ${enabledGlobalSlug}: ${String(error)}`,
            500,
          )
        }
      })

      // Custom tools
      customMCPTools.forEach((tool) => {
        const camelCasedToolName = toCamelCase(tool.name)
        const isToolEnabled = mcpAccessSettings['payload-mcp-tool']?.[camelCasedToolName] ?? false

        registerTool({
          isEnabled: isToolEnabled,
          payload,
          registrationFn: () =>
            server.registerTool(
              tool.name,
              {
                description: tool.description,
                inputSchema: fromJsonSchema(
                  tool.parameters as Parameters<typeof fromJsonSchema>[0],
                ),
              },
              payloadToolHandler(tool.handler),
            ),
          toolType: tool.name,
        })
      })

      // Custom prompts
      customMCPPrompts.forEach((prompt) => {
        const camelCasedPromptName = toCamelCase(prompt.name)
        const isPromptEnabled =
          mcpAccessSettings['payload-mcp-prompt']?.[camelCasedPromptName] ?? false

        if (isPromptEnabled) {
          server.registerPrompt(
            prompt.name,
            {
              argsSchema: fromJsonSchema(prompt.argsSchema as Parameters<typeof fromJsonSchema>[0]),
              description: prompt.description,
              title: prompt.title,
            },
            payloadPromptHandler(prompt.handler),
          )
          logger.info(`✅ Prompt: ${prompt.title} Registered.`)
        } else {
          logger.info(`⏭️ Prompt: ${prompt.title} Skipped.`)
        }
      })

      // Custom resources
      customMCPResources.forEach((resource) => {
        const camelCasedResourceName = toCamelCase(resource.name)
        const isResourceEnabled =
          mcpAccessSettings['payload-mcp-resource']?.[camelCasedResourceName] ?? false

        if (isResourceEnabled) {
          server.registerResource(
            resource.name,
            // @ts-expect-error - Overload type is not working however -- ResourceTemplate OR String is a valid type
            resource.uri,
            {
              description: resource.description,
              mimeType: resource.mimeType,
              title: resource.title,
            },
            payloadResourceHandler(resource.handler),
          )

          logger.info(`✅ Resource: ${resource.title} Registered.`)
        } else {
          logger.info(`⏭️ Resource: ${resource.title} Skipped.`)
        }
      })

      // Experimental - Auth Modification Tools
      if (mcpAccessSettings.auth?.auth && experimentalTools.auth?.enabled && isDevelopment) {
        registerTool({
          isEnabled: mcpAccessSettings.auth.auth,
          payload,
          registrationFn: () => authTool(server, req),
          toolType: 'Auth',
        })
      }

      if (mcpAccessSettings.auth?.login && experimentalTools.auth?.enabled && isDevelopment) {
        registerTool({
          isEnabled: mcpAccessSettings.auth.login,
          payload,
          registrationFn: () => loginTool(server, req),
          toolType: 'Login',
        })
      }

      if (mcpAccessSettings.auth?.verify && experimentalTools.auth?.enabled && isDevelopment) {
        registerTool({
          isEnabled: mcpAccessSettings.auth.verify,
          payload,
          registrationFn: () => verifyTool(server, req),
          toolType: 'Verify',
        })
      }

      if (mcpAccessSettings.auth?.resetPassword && experimentalTools.auth?.enabled) {
        registerTool({
          isEnabled: mcpAccessSettings.auth.resetPassword,
          payload,
          registrationFn: () => resetPasswordTool(server, req),
          toolType: 'Reset Password',
        })
      }

      if (mcpAccessSettings.auth?.forgotPassword && experimentalTools.auth?.enabled) {
        registerTool({
          isEnabled: mcpAccessSettings.auth.forgotPassword,
          payload,
          registrationFn: () => forgotPasswordTool(server, req),
          toolType: 'Forgot Password',
        })
      }

      if (mcpAccessSettings.auth?.unlock && experimentalTools.auth?.enabled) {
        registerTool({
          isEnabled: mcpAccessSettings.auth.unlock,
          payload,
          registrationFn: () => unlockTool(server, req),
          toolType: 'Unlock',
        })
      }

      logger.info('🚀 MCP Server Ready.')
    }
  } catch (error) {
    throw new APIError(`Error initializing MCP handler: ${String(error)}`, 500)
  }

  const transport = new WebStandardStreamableHTTPServerTransport({
    enableJsonResponse: true,
    sessionIdGenerator: undefined, // stateless — every request is independent
  })

  await server.connect(transport)

  return (request: Request) => transport.handleRequest(request)
}
