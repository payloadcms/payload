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
  globalSettings: GlobalSettings,
  req: PayloadRequest,
) => {
  const payload = req.payload
  const { auth, collections, config, custom, jobs, resources } = globalSettings.tools

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
  const collectionsConfig = pluginOptions.collections || {}
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
      // Resource tools
      if (resources?.create) {
        registerTool(
          resources.create,
          'Create Resource',
          () => createResourceTool(server, req, useVerboseLogs, collectionsConfig),
          payload,
          useVerboseLogs,
        )
      }

      if (resources?.delete) {
        registerTool(
          resources.delete,
          'Delete Resource',
          () => deleteResourceTool(server, req, useVerboseLogs, collectionsConfig),
          payload,
          useVerboseLogs,
        )
      }

      if (resources?.find) {
        registerTool(
          resources.find,
          'Find Resource',
          () => findResourceTool(server, req, useVerboseLogs, collectionsConfig),
          payload,
          useVerboseLogs,
        )
      }

      if (resources?.update) {
        registerTool(
          resources.update,
          'Update Resource',
          () => updateResourceTool(server, req, useVerboseLogs, collectionsConfig),
          payload,
          useVerboseLogs,
        )
      }

      // Custom tools
      customMCPTools.forEach((tool) => {
        const customSettings = custom
        const camelCasedToolName = toCamelCase(tool.name)
        const isToolEnabled = customSettings?.[camelCasedToolName] ?? true

        registerTool(
          isToolEnabled,
          tool.name,
          () => server.tool(tool.name, tool.description, tool.parameters, tool.handler),
          payload,
          useVerboseLogs,
        )
      })

      // Experimental - Collection tools
      if (collections?.create && experimentalTools.collections?.enabled && isDevelopment) {
        registerTool(
          collections.create,
          'Create Collection',
          () =>
            createCollectionTool(server, req, useVerboseLogs, collectionsDirPath, configFilePath),
          payload,
          useVerboseLogs,
        )
      }
      if (collections?.delete && experimentalTools.collections?.enabled && isDevelopment) {
        registerTool(
          collections.delete,
          'Delete Collection',
          () =>
            deleteCollectionTool(server, req, useVerboseLogs, collectionsDirPath, configFilePath),
          payload,
          useVerboseLogs,
        )
      }

      if (collections?.find && experimentalTools.collections?.enabled && isDevelopment) {
        registerTool(
          collections.find,
          'Find Collection',
          () => findCollectionTool(server, req, useVerboseLogs, collectionsDirPath),
          payload,
          useVerboseLogs,
        )
      }

      if (collections?.update && experimentalTools.collections?.enabled && isDevelopment) {
        registerTool(
          collections.update,
          'Update Collection',
          () =>
            updateCollectionTool(server, req, useVerboseLogs, collectionsDirPath, configFilePath),
          payload,
          useVerboseLogs,
        )
      }

      // Experimental - Config tools
      if (config?.find && experimentalTools.config?.enabled && isDevelopment) {
        registerTool(
          config.find,
          'Find Config',
          () => findConfigTool(server, req, useVerboseLogs, configFilePath),
          payload,
          useVerboseLogs,
        )
      }

      if (config?.update && experimentalTools.config?.enabled && isDevelopment) {
        registerTool(
          config.update,
          'Update Config',
          () => updateConfigTool(server, req, useVerboseLogs, configFilePath),
          payload,
          useVerboseLogs,
        )
      }

      // Experimental - Job tools
      if (jobs?.create && experimentalTools.jobs?.enabled && isDevelopment) {
        registerTool(
          jobs.create,
          'Create Job',
          () => createJobTool(server, req, useVerboseLogs, jobsDirPath),
          payload,
          useVerboseLogs,
        )
      }

      if (jobs?.update && experimentalTools.jobs?.enabled && isDevelopment) {
        registerTool(
          jobs.update,
          'Update Job',
          () => updateJobTool(server, req, useVerboseLogs, jobsDirPath),
          payload,
          useVerboseLogs,
        )
      }

      if (jobs?.run && experimentalTools.jobs?.enabled && isDevelopment) {
        registerTool(
          jobs.run,
          'Run Job',
          () => runJobTool(server, req, useVerboseLogs),
          payload,
          useVerboseLogs,
        )
      }

      // Experimental - Auth tools
      if (auth?.auth && experimentalTools.auth?.enabled && isDevelopment) {
        registerTool(
          auth.auth,
          'Auth',
          () => authTool(server, req, useVerboseLogs),
          payload,
          useVerboseLogs,
        )
      }

      if (auth?.login && experimentalTools.auth?.enabled && isDevelopment) {
        registerTool(
          auth.login,
          'Login',
          () => loginTool(server, req, useVerboseLogs),
          payload,
          useVerboseLogs,
        )
      }

      if (auth?.verify && experimentalTools.auth?.enabled && isDevelopment) {
        registerTool(
          auth.verify,
          'Verify',
          () => verifyTool(server, req, useVerboseLogs),
          payload,
          useVerboseLogs,
        )
      }

      if (auth?.resetPassword && experimentalTools.auth?.enabled) {
        registerTool(
          auth.resetPassword,
          'Reset Password',
          () => resetPasswordTool(server, req, useVerboseLogs),
          payload,
          useVerboseLogs,
        )
      }

      if (auth?.forgotPassword && experimentalTools.auth?.enabled) {
        registerTool(
          auth.forgotPassword,
          'Forgot Password',
          () => forgotPasswordTool(server, req, useVerboseLogs),
          payload,
          useVerboseLogs,
        )
      }

      if (auth?.unlock && experimentalTools.auth?.enabled) {
        registerTool(
          auth.unlock,
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
