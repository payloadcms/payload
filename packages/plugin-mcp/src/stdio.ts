import type { Config, SanitizedConfig } from 'payload'

/* eslint-disable no-console */
import { serveStdio } from '@modelcontextprotocol/server/stdio'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createLocalReq, getPayload } from 'payload'
import { findConfig, loadEnv } from 'payload/node'

import { getAuthorizedMCP } from './endpoint/access.js'
import { buildMcpServer, refreshMcpServer } from './mcp/buildMcpServer.js'
import { sanitizeMCPConfig } from './mcp/sanitizeMCPConfig.js'
import { findPluginConfig } from './utils/getPluginConfig.js'
import { resolveProjectRoot } from './utils/resolveProjectRoot.js'

/**
 * Starts Payload's MCP server over stdin and stdout.
 *
 * Set `PAYLOAD_MCP_AUTHORIZATION` to authenticate. In development,
 * `PAYLOAD_MCP_OVERRIDE_ACCESS=true` skips access checks.
 */
export const runMcpStdio = async (
  configOverride?: SanitizedConfig,
  connectHMR?: (refreshMcpServer: () => Promise<void>) => Promise<void>,
): Promise<void> => {
  // MCP clients may start this command from another folder. Move to the Payload
  // project so findConfig() can find the config.
  const projectRoot = resolveProjectRoot(fileURLToPath(import.meta.url))
  if (projectRoot) {
    process.chdir(projectRoot)
  }

  loadEnv()
  const configPath = findConfig()
  const configURL = pathToFileURL(configPath).href
  const configModule = configOverride ? undefined : await import(configURL)
  const config: SanitizedConfig = configOverride ?? (await (configModule?.default ?? configModule))

  /**
   * stdout is only for MCP messages. The spec says the server must not write
   * logs there and may write them to stderr instead.
   *
   * The 2.0 client library recovers from stray stdout logs, but that behavior is not
   * guaranteed. Move Payload logs to stderr so Payload does not add invalid data
   * to stdout. Keep options from configurable loggers. Replace pre-built loggers
   * because their output cannot be redirected.
   *
   * @see https://modelcontextprotocol.io/specification/2025-11-25/basic/transports#stdio
   */
  const loggerConfig: { logger?: Config['logger'] } = config
  if (
    loggerConfig.logger &&
    typeof loggerConfig.logger === 'object' &&
    'options' in loggerConfig.logger
  ) {
    loggerConfig.logger.destination = process.stderr
  } else {
    loggerConfig.logger = { destination: process.stderr, options: {} }
  }

  const payload = await getPayload({
    config,
    cron: false,
    devReloadStrategy: { connect: () => () => undefined },
    disableOnInit: true,
  })

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

  const createMcpServerArgs = async () => {
    const pluginConfig =
      findPluginConfig({ config: payload.config }) ??
      sanitizeMCPConfig({ config: payload.config, pluginConfig: {} })

    const req = await createLocalReq({ req: { headers } }, payload)
    req.payloadAPI = 'MCP' as const
    const authorizedMCP = await getAuthorizedMCP({ overrideAccess, req })

    return { authorizedMCP, pluginConfig, req }
  }
  let mcpServer: ReturnType<typeof buildMcpServer> | undefined
  const stdioServer = serveStdio(
    async () => {
      mcpServer = buildMcpServer({
        ...(await createMcpServerArgs()),
        refreshable: Boolean(connectHMR),
      })
      return mcpServer
    },
    {
      onerror: (err) => {
        // MCP messages use stdout, so write SDK errors to stderr.
        console.error('[payload-mcp] error serving MCP over stdio:', err)
      },
    },
  )

  const refreshStdioServer = async () => {
    if (mcpServer) {
      refreshMcpServer({ ...(await createMcpServerArgs()), server: mcpServer })
    }
  }

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

  await connectHMR?.(refreshStdioServer)
}
