import type { Config, Plugin, SanitizedConfig } from 'payload'

/* eslint-disable no-console */
import { serveStdio } from '@modelcontextprotocol/server/stdio'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createLocalReq, getPayload } from 'payload'
import { findConfig } from 'payload/node'

import type { SanitizedMCPPluginConfig } from './types.js'

import { getAuthorizedMCP } from './endpoint/access.js'
import { buildMcpServer } from './mcp/buildMcpServer.js'
import { sanitizeMCPConfig } from './mcp/sanitizeMCPConfig.js'
import { getPluginConfig } from './utils/getPluginConfig.js'
import { resolveProjectRoot } from './utils/resolveProjectRoot.js'

/**
 * Starts Payload's MCP server over stdin and stdout.
 *
 * Set `PAYLOAD_MCP_AUTHORIZATION` to authenticate. In development,
 * `PAYLOAD_MCP_OVERRIDE_ACCESS=true` skips access checks.
 */
export const runMcpStdio = async (): Promise<void> => {
  // MCP clients may start this command from another folder. Move to the Payload
  // project so findConfig() can find the config.
  const projectRoot = resolveProjectRoot(fileURLToPath(import.meta.url))
  if (projectRoot) {
    process.chdir(projectRoot)
  }

  const configPath = findConfig()
  const configModule = await import(pathToFileURL(configPath).toString())
  const config = (await (configModule.default ?? configModule)) as SanitizedConfig

  /**
   * stdout is only for MCP messages. The spec says the server must not write
   * logs there and may write them to stderr instead.
   *
   * The beta.1 client library recovers from stray stdout logs, but that behavior is not
   * guaranteed. Move Payload logs to stderr so Payload does not add invalid data
   * to stdout. Keep options from configurable loggers. Replace pre-built loggers
   * because their output cannot be redirected.
   *
   * @see https://modelcontextprotocol.io/specification/2025-11-25/basic/transports#stdio
   */
  const loggerConfig: { logger?: Config['logger'] } = config
  if (loggerConfig.logger && loggerConfig.logger !== 'sync' && 'options' in loggerConfig.logger) {
    loggerConfig.logger.destination = process.stderr
  } else {
    loggerConfig.logger = { destination: process.stderr, options: {} }
  }

  const payload = await getPayload({ config })

  let pluginConfig: SanitizedMCPPluginConfig
  try {
    pluginConfig = getPluginConfig({ config: payload.config })
  } catch {
    // The command also works when mcpPlugin() is not in the Payload config.
    pluginConfig = sanitizeMCPConfig({ config: payload.config, pluginConfig: {} })

    const fallbackPlugin: Plugin = (config) => config
    Object.assign(fallbackPlugin, {
      slug: '@payloadcms/plugin-mcp',
      sanitizedOptions: pluginConfig,
    })
    payload.config.plugins ??= []
    payload.config.plugins.push(fallbackPlugin)
  }

  const overrideAccessEnv = process.env.PAYLOAD_MCP_OVERRIDE_ACCESS
  let overrideAccess = false

  if (overrideAccessEnv === 'true') {
    overrideAccess = true
  } else if (overrideAccessEnv && overrideAccessEnv !== 'false') {
    throw new Error('PAYLOAD_MCP_OVERRIDE_ACCESS must be "true" or "false".')
  }

  if (overrideAccess && process.env.NODE_ENV !== 'development') {
    throw new Error('PAYLOAD_MCP_OVERRIDE_ACCESS is only available in development.')
  }

  const headers = new Headers()
  if (process.env.PAYLOAD_MCP_AUTHORIZATION) {
    headers.set('Authorization', process.env.PAYLOAD_MCP_AUTHORIZATION)
  }

  const req = await createLocalReq({ req: { headers } }, payload)
  req.payloadAPI = 'MCP' as const
  const authorizedMCP = await getAuthorizedMCP({ overrideAccess, req })

  const stdioServer = serveStdio(() => buildMcpServer({ authorizedMCP, pluginConfig, req }), {
    onerror: (err) => {
      // MCP messages use stdout, so write SDK errors to stderr.
      console.error('[payload-mcp] error serving MCP over stdio:', err)
    },
  })

  // Close the MCP server and Payload when the client disconnects or the process stops.
  let isShuttingDown = false
  const shutdown = async () => {
    if (isShuttingDown) {
      return
    }
    isShuttingDown = true

    try {
      await stdioServer.close()
    } catch (err) {
      console.error('[payload-mcp] error closing server:', err)
    }

    try {
      await payload.destroy()
    } catch (err) {
      console.error('[payload-mcp] error destroying payload:', err)
    }

    process.exit(0)
  }

  process.once('SIGINT', () => void shutdown())
  process.once('SIGTERM', () => void shutdown())
  process.stdin.once('close', () => void shutdown())
}
