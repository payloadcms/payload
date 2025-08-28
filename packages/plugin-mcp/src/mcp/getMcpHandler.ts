import type { PayloadRequest } from 'payload'

import { createMcpHandler } from '@vercel/mcp-adapter'
import { join } from 'path'

import type {
  GlobalSettings,
  McpHandlerOptions,
  McpServerOptions,
  PluginMcpServerConfig,
} from '../types.js'

import { toCamelCase } from '../utils/camelCase.js'
import { registerTool } from './registerTool.js'
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
import { createResourceTool } from './tools/resource/create.js'
import { deleteResourceTool } from './tools/resource/delete.js'
import { findResourceTool } from './tools/resource/find.js'
import { updateResourceTool } from './tools/resource/update.js'

export const getMcpHandler = (
  pluginOptions: PluginMcpServerConfig,
  globalSettings: GlobalSettings,
  req: PayloadRequest,
) => {
  const payload = req.payload
  const { basePath, maxDuration, serverInfo, verboseLogs } = globalSettings.endpoint
  const { auth, collections, config, custom, jobs, resources } = globalSettings.tools

  const collectionsConfig = pluginOptions.collections || {}
  const collectionsDirPath =
    pluginOptions.collectionsDirPath || join(process.cwd(), 'src/collections')
  const configFilePath =
    pluginOptions.configFilePath || join(process.cwd(), 'src/payload.config.ts')
  const jobsDirPath = pluginOptions.jobsDirPath || join(process.cwd(), 'src/jobs')
  const mcpOptions = pluginOptions.mcp || {}
  const customMcpTools = mcpOptions.tools || []
  const mcpHandlerOptions: McpHandlerOptions = mcpOptions.handlerOptions || {}
  const serverOptions: McpServerOptions = mcpOptions.serverOptions || {
    serverInfo: {
      name: serverInfo.name || 'Payload MCP',
      version: serverInfo.version || '0.1.0',
    },
  }

  const useVerboseLogs = mcpHandlerOptions.verboseLogs ?? verboseLogs ?? true
  return createMcpHandler(
    (server) => {
      // Resource tools
      registerTool(
        resources.create,
        'Create Resource',
        () => createResourceTool(server, req, useVerboseLogs, collectionsConfig),
        payload,
        useVerboseLogs,
      )

      registerTool(
        resources.delete,
        'Delete Resource',
        () => deleteResourceTool(server, req, useVerboseLogs, collectionsConfig),
        payload,
        useVerboseLogs,
      )

      registerTool(
        resources.find,
        'Find Resource',
        () => findResourceTool(server, req, useVerboseLogs, collectionsConfig),
        payload,
        useVerboseLogs,
      )

      registerTool(
        resources.update,
        'Update Resource',
        () => updateResourceTool(server, req, useVerboseLogs, collectionsConfig),
        payload,
        useVerboseLogs,
      )

      // Collection tools
      registerTool(
        collections.create,
        'Create Collection',
        () => createCollectionTool(server, req, useVerboseLogs, collectionsDirPath, configFilePath),
        payload,
        useVerboseLogs,
      )

      registerTool(
        collections.delete,
        'Delete Collection',
        () => deleteCollectionTool(server, req, useVerboseLogs, collectionsDirPath, configFilePath),
        payload,
        useVerboseLogs,
      )

      registerTool(
        collections.find,
        'Find Collection',
        () => findCollectionTool(server, req, useVerboseLogs, collectionsDirPath),
        payload,
        useVerboseLogs,
      )

      registerTool(
        collections.update,
        'Update Collection',
        () => updateCollectionTool(server, req, useVerboseLogs, collectionsDirPath, configFilePath),
        payload,
        useVerboseLogs,
      )

      // Config tools
      registerTool(
        config.find,
        'Find Config',
        () => findConfigTool(server, req, useVerboseLogs, configFilePath),
        payload,
        useVerboseLogs,
      )

      registerTool(
        config.update,
        'Update Config',
        () => updateConfigTool(server, req, useVerboseLogs, configFilePath),
        payload,
        useVerboseLogs,
      )

      // Job tools
      registerTool(
        jobs.create,
        'Create Job',
        () => createJobTool(server, req, useVerboseLogs, jobsDirPath),
        payload,
        useVerboseLogs,
      )

      registerTool(
        jobs.update,
        'Update Job',
        () => updateJobTool(server, req, useVerboseLogs, jobsDirPath),
        payload,
        useVerboseLogs,
      )

      registerTool(
        jobs.run,
        'Run Job',
        () => runJobTool(server, req, useVerboseLogs),
        payload,
        useVerboseLogs,
      )

      // Auth tools
      registerTool(
        auth.auth,
        'Auth',
        () => authTool(server, req, useVerboseLogs),
        payload,
        useVerboseLogs,
      )

      registerTool(
        auth.login,
        'Login',
        () => loginTool(server, req, useVerboseLogs),
        payload,
        useVerboseLogs,
      )

      registerTool(
        auth.verify,
        'Verify',
        () => verifyTool(server, req, useVerboseLogs),
        payload,
        useVerboseLogs,
      )

      registerTool(
        auth.resetPassword,
        'Reset Password',
        () => resetPasswordTool(server, req, useVerboseLogs),
        payload,
        useVerboseLogs,
      )

      registerTool(
        auth.forgotPassword,
        'Forgot Password',
        () => forgotPasswordTool(server, req, useVerboseLogs),
        payload,
        useVerboseLogs,
      )

      registerTool(
        auth.unlock,
        'Unlock',
        () => unlockTool(server, req, useVerboseLogs),
        payload,
        useVerboseLogs,
      )

      // Custom tools
      customMcpTools.forEach((tool) => {
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

      if (useVerboseLogs) {
        payload.logger.info('[payload-mcp] 🚀 Tools Registered.')
      }
    },
    {
      serverInfo: serverOptions.serverInfo,
    },
    {
      basePath: mcpHandlerOptions.basePath || basePath || '/api',
      maxDuration: mcpHandlerOptions.maxDuration || maxDuration || 60,
      redisUrl: mcpHandlerOptions.redisUrl || process.env.REDIS_URL,
      verboseLogs: mcpHandlerOptions.verboseLogs ?? verboseLogs ?? true,
    },
  )
}
