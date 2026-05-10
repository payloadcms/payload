import type { McpServer } from '@modelcontextprotocol/server'

import { APIError, type PayloadRequest } from 'payload'

import type { MCPAccess, MCPPluginConfig } from '../types.js'

import { getLogger } from '../utils/getLogger.js'
import { getPluginConfig } from '../utils/getPluginConfig.js'
import { registerTool } from './helpers/registerTool.js'
import { authTool } from './tools/auth/auth.js'
import { forgotPasswordTool } from './tools/auth/forgotPassword.js'
import { loginTool } from './tools/auth/login.js'
import { resetPasswordTool } from './tools/auth/resetPassword.js'
import { unlockTool } from './tools/auth/unlock.js'
import { verifyTool } from './tools/auth/verify.js'

export const registerExperimentalAuthTools: (args: {
  mcpAccess: MCPAccess
  req: PayloadRequest
  server: McpServer
}) => void = ({ mcpAccess, req, server }) => {
  const { payload } = req
  const pluginConfig = getPluginConfig({ config: payload.config })
  const logger = getLogger({ payload })

  try {
    const experimentalTools: NonNullable<MCPPluginConfig['experimental']>['tools'] =
      pluginConfig?.experimental?.tools || {}

    // Experimental - Auth Modification Tools
    if (mcpAccess.auth?.auth && experimentalTools.auth?.enabled) {
      registerTool({
        isEnabled: mcpAccess.auth.auth,
        payload,
        registrationFn: () => authTool(server, req),
        toolType: 'Auth',
      })
    }

    if (mcpAccess.auth?.login && experimentalTools.auth?.enabled) {
      registerTool({
        isEnabled: mcpAccess.auth.login,
        payload,
        registrationFn: () => loginTool(server, req),
        toolType: 'Login',
      })
    }

    if (mcpAccess.auth?.verify && experimentalTools.auth?.enabled) {
      registerTool({
        isEnabled: mcpAccess.auth.verify,
        payload,
        registrationFn: () => verifyTool(server, req),
        toolType: 'Verify',
      })
    }

    if (mcpAccess.auth?.resetPassword && experimentalTools.auth?.enabled) {
      registerTool({
        isEnabled: mcpAccess.auth.resetPassword,
        payload,
        registrationFn: () => resetPasswordTool(server, req),
        toolType: 'Reset Password',
      })
    }

    if (mcpAccess.auth?.forgotPassword && experimentalTools.auth?.enabled) {
      registerTool({
        isEnabled: mcpAccess.auth.forgotPassword,
        payload,
        registrationFn: () => forgotPasswordTool(server, req),
        toolType: 'Forgot Password',
      })
    }

    if (mcpAccess.auth?.unlock && experimentalTools.auth?.enabled) {
      registerTool({
        isEnabled: mcpAccess.auth.unlock,
        payload,
        registrationFn: () => unlockTool(server, req),
        toolType: 'Unlock',
      })
    }

    logger.info('🚀 MCP Server Ready.')
  } catch (error) {
    throw new APIError(`Error initializing MCP handler: ${String(error)}`, 500)
  }
}
