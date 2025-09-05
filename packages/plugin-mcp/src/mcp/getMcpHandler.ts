import type { PayloadRequest } from 'payload'

import { createMcpHandler } from '@vercel/mcp-adapter'
import { join } from 'path'

import type { GlobalSettings, PluginMCPServerConfig } from '../types.js'

import { toCamelCase } from '../utils/camelCase.js'
import { registerTool } from './registerTool.js'

// Tools
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
  globalSettings: Record<string, unknown>,
  req: PayloadRequest,
) => {
  const payload = req.payload

  // MCP Server and Handler Options
  const MCPOptions = pluginOptions.mcp || {}
  const customMCPTools = MCPOptions.tools || []
  const MCPHandlerOptions = MCPOptions.handlerOptions || {}
  const serverOptions = MCPOptions.serverOptions || {}
  const useVerboseLogs = MCPHandlerOptions.verboseLogs ?? false

  // Experimental MCP Tool Requirements
  const isDevelopment = process.env.NODE_ENV === 'development'
  const experimentalTools: NonNullable<PluginMCPServerConfig['_experimental']>['tools'] =
    pluginOptions?._experimental?.tools || {}
  const collectionsPluginConfig = pluginOptions.collections || {}
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

  return createMcpHandler(
    (server) => {
      const enabledCollectionSlugs = Object.keys(collectionsPluginConfig || {}).filter(
        (collection) => collectionsPluginConfig?.[collection]?.enabled,
      )

      // Collection Operation Tools
      enabledCollectionSlugs.forEach((enabledCollectionSlug) => {
        const collectonGlobalSetting = globalSettings.tools?.[
          `${enabledCollectionSlug}-capabilities`
        ] as Record<string, unknown>
        const allowCreate = collectonGlobalSetting[`${enabledCollectionSlug}-create`] as boolean
        const allowDelete = collectonGlobalSetting[`${enabledCollectionSlug}-delete`] as boolean
        const allowFind = collectonGlobalSetting[`${enabledCollectionSlug}-find`] as boolean
        const allowUpdate = collectonGlobalSetting[`${enabledCollectionSlug}-update`] as boolean

        if (allowCreate) {
          registerTool(
            allowCreate,
            `Create ${enabledCollectionSlug}`,
            () =>
              createResourceTool(
                server,
                req,
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
                useVerboseLogs,
                enabledCollectionSlug,
                collectionsPluginConfig,
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
                useVerboseLogs,
                enabledCollectionSlug,
                collectionsPluginConfig,
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
                useVerboseLogs,
                enabledCollectionSlug,
                collectionsPluginConfig,
              ),
            payload,
            useVerboseLogs,
          )
        }
      })

      // Custom tools
      customMCPTools.forEach((tool) => {
        const camelCasedToolName = toCamelCase(tool.name)
        const isToolEnabled = globalSettings.tools.custom?.[camelCasedToolName] ?? true

        registerTool(
          isToolEnabled,
          tool.name,
          () => server.tool(tool.name, tool.description, tool.parameters, tool.handler),
          payload,
          useVerboseLogs,
        )
      })

      // Experimental - Collection Schema Modfication Tools
      if (
        globalSettings.tools.collections?.create &&
        experimentalTools.collections?.enabled &&
        isDevelopment
      ) {
        registerTool(
          globalSettings.tools.collections.create,
          'Create Collection',
          () =>
            createCollectionTool(server, req, useVerboseLogs, collectionsDirPath, configFilePath),
          payload,
          useVerboseLogs,
        )
      }
      if (
        globalSettings.tools.collections?.delete &&
        experimentalTools.collections?.enabled &&
        isDevelopment
      ) {
        registerTool(
          globalSettings.tools.collections.delete,
          'Delete Collection',
          () =>
            deleteCollectionTool(server, req, useVerboseLogs, collectionsDirPath, configFilePath),
          payload,
          useVerboseLogs,
        )
      }

      if (
        globalSettings.tools.collections?.find &&
        experimentalTools.collections?.enabled &&
        isDevelopment
      ) {
        registerTool(
          globalSettings.tools.collections.find,
          'Find Collection',
          () => findCollectionTool(server, req, useVerboseLogs, collectionsDirPath),
          payload,
          useVerboseLogs,
        )
      }

      if (
        globalSettings.tools.collections?.update &&
        experimentalTools.collections?.enabled &&
        isDevelopment
      ) {
        registerTool(
          globalSettings.tools.collections.update,
          'Update Collection',
          () =>
            updateCollectionTool(server, req, useVerboseLogs, collectionsDirPath, configFilePath),
          payload,
          useVerboseLogs,
        )
      }

      // Experimental - Payload Config Modification Tools
      if (globalSettings.tools.config?.find && experimentalTools.config?.enabled && isDevelopment) {
        registerTool(
          globalSettings.tools.config.find,
          'Find Config',
          () => findConfigTool(server, req, useVerboseLogs, configFilePath),
          payload,
          useVerboseLogs,
        )
      }

      if (
        globalSettings.tools.config?.update &&
        experimentalTools.config?.enabled &&
        isDevelopment
      ) {
        registerTool(
          globalSettings.tools.config.update,
          'Update Config',
          () => updateConfigTool(server, req, useVerboseLogs, configFilePath),
          payload,
          useVerboseLogs,
        )
      }

      // Experimental - Job Modification Tools
      if (globalSettings.tools.jobs?.create && experimentalTools.jobs?.enabled && isDevelopment) {
        registerTool(
          globalSettings.tools.jobs.create,
          'Create Job',
          () => createJobTool(server, req, useVerboseLogs, jobsDirPath),
          payload,
          useVerboseLogs,
        )
      }

      if (globalSettings.tools.jobs?.update && experimentalTools.jobs?.enabled && isDevelopment) {
        registerTool(
          globalSettings.tools.jobs.update,
          'Update Job',
          () => updateJobTool(server, req, useVerboseLogs, jobsDirPath),
          payload,
          useVerboseLogs,
        )
      }

      if (globalSettings.tools.jobs?.run && experimentalTools.jobs?.enabled && isDevelopment) {
        registerTool(
          globalSettings.tools.jobs.run,
          'Run Job',
          () => runJobTool(server, req, useVerboseLogs),
          payload,
          useVerboseLogs,
        )
      }

      // Experimental - Auth Modification Tools
      if (globalSettings.tools.auth?.auth && experimentalTools.auth?.enabled && isDevelopment) {
        registerTool(
          globalSettings.tools.auth.auth,
          'Auth',
          () => authTool(server, req, useVerboseLogs),
          payload,
          useVerboseLogs,
        )
      }

      if (globalSettings.tools.auth?.login && experimentalTools.auth?.enabled && isDevelopment) {
        registerTool(
          globalSettings.tools.auth.login,
          'Login',
          () => loginTool(server, req, useVerboseLogs),
          payload,
          useVerboseLogs,
        )
      }

      if (globalSettings.tools.auth?.verify && experimentalTools.auth?.enabled && isDevelopment) {
        registerTool(
          globalSettings.tools.auth.verify,
          'Verify',
          () => verifyTool(server, req, useVerboseLogs),
          payload,
          useVerboseLogs,
        )
      }

      if (globalSettings.tools.auth?.resetPassword && experimentalTools.auth?.enabled) {
        registerTool(
          globalSettings.tools.auth.resetPassword,
          'Reset Password',
          () => resetPasswordTool(server, req, useVerboseLogs),
          payload,
          useVerboseLogs,
        )
      }

      if (globalSettings.tools.auth?.forgotPassword && experimentalTools.auth?.enabled) {
        registerTool(
          globalSettings.tools.auth.forgotPassword,
          'Forgot Password',
          () => forgotPasswordTool(server, req, useVerboseLogs),
          payload,
          useVerboseLogs,
        )
      }

      if (globalSettings.tools.auth?.unlock && experimentalTools.auth?.enabled) {
        registerTool(
          globalSettings.tools.auth.unlock,
          'Unlock',
          () => unlockTool(server, req, useVerboseLogs),
          payload,
          useVerboseLogs,
        )
      }

      if (useVerboseLogs) {
        payload.logger.info('[payload-mcp] 🚀 Tools Registered.')
      }
    },
    {
      serverInfo: serverOptions.serverInfo,
    },
    {
      basePath: MCPHandlerOptions.basePath || '/api',
      maxDuration: MCPHandlerOptions.maxDuration || 60,
      redisUrl: MCPHandlerOptions.redisUrl || process.env.REDIS_URL,
      verboseLogs: useVerboseLogs,
    },
  )
}
