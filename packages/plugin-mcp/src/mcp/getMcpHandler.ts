import type { JSONSchema4 } from 'json-schema'

import { createMcpHandler } from '@vercel/mcp-adapter'
import { join } from 'path'
import { APIError, configToJSONSchema, type PayloadRequest, type TypedUser } from 'payload'

import type { PluginMCPServerConfig, ToolSettings } from '../types.js'

import { toCamelCase } from '../utils/camelCase.js'
import { getEnabledSlugs } from '../utils/getEnabledSlugs.js'
import { registerTool } from './registerTool.js'

// Tools
import { findGlobalTool } from './tools/global/find.js'
import { updateGlobalTool } from './tools/global/update.js'
import { createResourceTool } from './tools/resource/create.js'
import { deleteResourceTool } from './tools/resource/delete.js'
import { findResourceTool } from './tools/resource/find.js'
import { updateResourceTool } from './tools/resource/update.js'

// Experimental Tools
import { authTool } from './tools/auth/auth.js'
import { forgotPasswordTool } from './tools/auth/forgotPassword.js'
import { loginTool } from './tools/auth/login.js'
import { resetPasswordTool } from './tools/auth/resetPassword.js'
import { unlockTool } from './tools/auth/unlock.js'
import { verifyTool } from './tools/auth/verify.js'
import { createCollectionTool } from './tools/collection/create.js'
import { deleteCollectionTool } from './tools/collection/delete.js'
import { findCollectionTool } from './tools/collection/find.js'
import { updateCollectionTool } from './tools/collection/update.js'
import { findConfigTool } from './tools/config/find.js'
import { updateConfigTool } from './tools/config/update.js'
import { createJobTool } from './tools/job/create.js'
import { runJobTool } from './tools/job/run.js'
import { updateJobTool } from './tools/job/update.js'

export const getMCPHandler = (
  pluginOptions: PluginMCPServerConfig,
  toolSettings: ToolSettings,
  req: PayloadRequest,
) => {
  const { payload } = req
  const configSchema = configToJSONSchema(payload.config)

  // User
  const user = toolSettings.user as TypedUser

  // MCP Server and Handler Options
  const MCPOptions = pluginOptions.mcp || {}
  const customMCPTools = MCPOptions.tools || []
  const customMCPPrompts = MCPOptions.prompts || []
  const customMCPResources = MCPOptions.resources || []
  const MCPHandlerOptions = MCPOptions.handlerOptions || {}
  const serverOptions = MCPOptions.serverOptions || {}
  const useVerboseLogs = MCPHandlerOptions.verboseLogs ?? false

  // Experimental MCP Tool Requirements
  const isDevelopment = process.env.NODE_ENV === 'development'
  const experimentalTools: NonNullable<PluginMCPServerConfig['experimental']>['tools'] =
    pluginOptions?.experimental?.tools || {}
  const collectionsPluginConfig = pluginOptions.collections || {}
  const globalsPluginConfig = pluginOptions.globals || {}
  const collectionsDirPath =
    experimentalTools && experimentalTools.collections?.collectionsDirPath
      ? experimentalTools.collections.collectionsDirPath
      : join(process.cwd(), 'src/collections')
  const configFilePath =
    experimentalTools && experimentalTools.config?.configFilePath
      ? experimentalTools.config.configFilePath
      : join(process.cwd(), 'src/payload.config.ts')
  const jobsDirPath =
    experimentalTools && experimentalTools.jobs?.jobsDirPath
      ? experimentalTools.jobs.jobsDirPath
      : join(process.cwd(), 'src/jobs')

  try {
    return createMcpHandler(
      (server) => {
        // Get enabled collections
        const enabledCollectionSlugs = getEnabledSlugs(collectionsPluginConfig, [
          'find',
          'create',
          'update',
          'delete',
        ])

        // Collection Operation Tools
        enabledCollectionSlugs.forEach((enabledCollectionSlug) => {
          try {
            const schema = configSchema.definitions?.[enabledCollectionSlug] as JSONSchema4

            const toolCapabilities = toolSettings?.[
              `${toCamelCase(enabledCollectionSlug)}`
            ] as Record<string, unknown>
            const allowCreate: boolean | undefined = toolCapabilities['create'] as boolean
            const allowUpdate: boolean | undefined = toolCapabilities['update'] as boolean
            const allowFind: boolean | undefined = toolCapabilities['find'] as boolean
            const allowDelete: boolean | undefined = toolCapabilities['delete'] as boolean

            if (allowCreate) {
              registerTool(
                allowCreate,
                `Create ${enabledCollectionSlug}`,
                () =>
                  createResourceTool(
                    server,
                    req,
                    user,
                    useVerboseLogs,
                    enabledCollectionSlug,
                    collectionsPluginConfig,
                    schema,
                  ),
                payload,
                useVerboseLogs,
              )
            }
            if (allowUpdate) {
              registerTool(
                allowUpdate,
                `Update ${enabledCollectionSlug}`,
                () =>
                  updateResourceTool(
                    server,
                    req,
                    user,
                    useVerboseLogs,
                    enabledCollectionSlug,
                    collectionsPluginConfig,
                    schema,
                  ),
                payload,
                useVerboseLogs,
              )
            }
            if (allowFind) {
              registerTool(
                allowFind,
                `Find ${enabledCollectionSlug}`,
                () =>
                  findResourceTool(
                    server,
                    req,
                    user,
                    useVerboseLogs,
                    enabledCollectionSlug,
                    collectionsPluginConfig,
                  ),
                payload,
                useVerboseLogs,
              )
            }
            if (allowDelete) {
              registerTool(
                allowDelete,
                `Delete ${enabledCollectionSlug}`,
                () =>
                  deleteResourceTool(
                    server,
                    req,
                    user,
                    useVerboseLogs,
                    enabledCollectionSlug,
                    collectionsPluginConfig,
                  ),
                payload,
                useVerboseLogs,
              )
            }
          } catch (error) {
            throw new APIError(
              `Error registering tools for collection ${enabledCollectionSlug}: ${String(error)}`,
              500,
            )
          }
        })

        // Global Operation Tools
        const enabledGlobalSlugs = getEnabledSlugs(globalsPluginConfig, ['find', 'update'])

        enabledGlobalSlugs.forEach((enabledGlobalSlug) => {
          try {
            const schema = configSchema.definitions?.[enabledGlobalSlug] as JSONSchema4

            const toolCapabilities = toolSettings?.[`${toCamelCase(enabledGlobalSlug)}`] as Record<
              string,
              unknown
            >
            const allowFind: boolean | undefined = toolCapabilities['find'] as boolean
            const allowUpdate: boolean | undefined = toolCapabilities['update'] as boolean

            if (allowFind) {
              registerTool(
                allowFind,
                `Find ${enabledGlobalSlug}`,
                () =>
                  findGlobalTool(
                    server,
                    req,
                    user,
                    useVerboseLogs,
                    enabledGlobalSlug,
                    globalsPluginConfig,
                  ),
                payload,
                useVerboseLogs,
              )
            }
            if (allowUpdate) {
              registerTool(
                allowUpdate,
                `Update ${enabledGlobalSlug}`,
                () =>
                  updateGlobalTool(
                    server,
                    req,
                    user,
                    useVerboseLogs,
                    enabledGlobalSlug,
                    globalsPluginConfig,
                    schema,
                  ),
                payload,
                useVerboseLogs,
              )
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
          const isToolEnabled = toolSettings.custom?.[camelCasedToolName] ?? true

          registerTool(
            isToolEnabled,
            tool.name,
            () => server.tool(tool.name, tool.description, tool.parameters, tool.handler),
            payload,
            useVerboseLogs,
          )
        })

        // Custom prompts
        customMCPPrompts.forEach((prompt) => {
          server.registerPrompt(
            prompt.name,
            {
              argsSchema: prompt.argsSchema,
              description: prompt.description,
              title: prompt.title,
            },
            prompt.handler,
          )
          if (useVerboseLogs) {
            payload.logger.info(`[payload-mcp] ✅ Prompt: ${prompt.title} Registered.`)
          }
        })

        // Custom resources
        customMCPResources.forEach((resource) => {
          server.registerResource(
            resource.name,
            // @ts-expect-error - Overload type is not working however -- ResourceTemplate OR String is a valid type
            resource.uri,
            {
              description: resource.description,
              mimeType: resource.mimeType,
              title: resource.title,
            },
            resource.handler,
          )

          if (useVerboseLogs) {
            payload.logger.info(`[payload-mcp] ✅ Resource: ${resource.title} Registered.`)
          }
        })

        // Experimental - Collection Schema Modfication Tools
        if (
          toolSettings.collections?.create &&
          experimentalTools.collections?.enabled &&
          isDevelopment
        ) {
          registerTool(
            toolSettings.collections.create,
            'Create Collection',
            () =>
              createCollectionTool(server, req, useVerboseLogs, collectionsDirPath, configFilePath),
            payload,
            useVerboseLogs,
          )
        }
        if (
          toolSettings.collections?.delete &&
          experimentalTools.collections?.enabled &&
          isDevelopment
        ) {
          registerTool(
            toolSettings.collections.delete,
            'Delete Collection',
            () =>
              deleteCollectionTool(server, req, useVerboseLogs, collectionsDirPath, configFilePath),
            payload,
            useVerboseLogs,
          )
        }

        if (
          toolSettings.collections?.find &&
          experimentalTools.collections?.enabled &&
          isDevelopment
        ) {
          registerTool(
            toolSettings.collections.find,
            'Find Collection',
            () => findCollectionTool(server, req, useVerboseLogs, collectionsDirPath),
            payload,
            useVerboseLogs,
          )
        }

        if (
          toolSettings.collections?.update &&
          experimentalTools.collections?.enabled &&
          isDevelopment
        ) {
          registerTool(
            toolSettings.collections.update,
            'Update Collection',
            () =>
              updateCollectionTool(server, req, useVerboseLogs, collectionsDirPath, configFilePath),
            payload,
            useVerboseLogs,
          )
        }

        // Experimental - Payload Config Modification Tools
        if (toolSettings.config?.find && experimentalTools.config?.enabled && isDevelopment) {
          registerTool(
            toolSettings.config.find,
            'Find Config',
            () => findConfigTool(server, req, useVerboseLogs, configFilePath),
            payload,
            useVerboseLogs,
          )
        }

        if (toolSettings.config?.update && experimentalTools.config?.enabled && isDevelopment) {
          registerTool(
            toolSettings.config.update,
            'Update Config',
            () => updateConfigTool(server, req, useVerboseLogs, configFilePath),
            payload,
            useVerboseLogs,
          )
        }

        // Experimental - Job Modification Tools
        if (toolSettings.jobs?.create && experimentalTools.jobs?.enabled && isDevelopment) {
          registerTool(
            toolSettings.jobs.create,
            'Create Job',
            () => createJobTool(server, req, useVerboseLogs, jobsDirPath),
            payload,
            useVerboseLogs,
          )
        }

        if (toolSettings.jobs?.update && experimentalTools.jobs?.enabled && isDevelopment) {
          registerTool(
            toolSettings.jobs.update,
            'Update Job',
            () => updateJobTool(server, req, useVerboseLogs, jobsDirPath),
            payload,
            useVerboseLogs,
          )
        }

        if (toolSettings.jobs?.run && experimentalTools.jobs?.enabled && isDevelopment) {
          registerTool(
            toolSettings.jobs.run,
            'Run Job',
            () => runJobTool(server, req, useVerboseLogs),
            payload,
            useVerboseLogs,
          )
        }

        // Experimental - Auth Modification Tools
        if (toolSettings.auth?.auth && experimentalTools.auth?.enabled && isDevelopment) {
          registerTool(
            toolSettings.auth.auth,
            'Auth',
            () => authTool(server, req, useVerboseLogs),
            payload,
            useVerboseLogs,
          )
        }

        if (toolSettings.auth?.login && experimentalTools.auth?.enabled && isDevelopment) {
          registerTool(
            toolSettings.auth.login,
            'Login',
            () => loginTool(server, req, useVerboseLogs),
            payload,
            useVerboseLogs,
          )
        }

        if (toolSettings.auth?.verify && experimentalTools.auth?.enabled && isDevelopment) {
          registerTool(
            toolSettings.auth.verify,
            'Verify',
            () => verifyTool(server, req, useVerboseLogs),
            payload,
            useVerboseLogs,
          )
        }

        if (toolSettings.auth?.resetPassword && experimentalTools.auth?.enabled) {
          registerTool(
            toolSettings.auth.resetPassword,
            'Reset Password',
            () => resetPasswordTool(server, req, useVerboseLogs),
            payload,
            useVerboseLogs,
          )
        }

        if (toolSettings.auth?.forgotPassword && experimentalTools.auth?.enabled) {
          registerTool(
            toolSettings.auth.forgotPassword,
            'Forgot Password',
            () => forgotPasswordTool(server, req, useVerboseLogs),
            payload,
            useVerboseLogs,
          )
        }

        if (toolSettings.auth?.unlock && experimentalTools.auth?.enabled) {
          registerTool(
            toolSettings.auth.unlock,
            'Unlock',
            () => unlockTool(server, req, useVerboseLogs),
            payload,
            useVerboseLogs,
          )
        }

        if (useVerboseLogs) {
          payload.logger.info('[payload-mcp] 🚀 MCP Server Ready.')
        }
      },
      {
        serverInfo: serverOptions.serverInfo,
      },
      {
        basePath: MCPHandlerOptions.basePath || '/api',
        maxDuration: MCPHandlerOptions.maxDuration || 60,
        // INFO: Disabled until developer clarity is reached for server side streaming and we have an auth pattern for all SSE patterns
        // redisUrl: MCPHandlerOptions.redisUrl || process.env.REDIS_URL,
        verboseLogs: useVerboseLogs,
      },
    )
  } catch (error) {
    throw new APIError(`Error initializing MCP handler: ${String(error)}`, 500)
  }
}
