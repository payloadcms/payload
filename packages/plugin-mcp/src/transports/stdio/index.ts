import type { MaybePromise, Plugin, SanitizedConfig } from 'payload'

/* eslint-disable no-console */
import { StdioServerTransport } from '@modelcontextprotocol/server'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createLocalReq, getPayload } from 'payload'
import { findConfig } from 'payload/node'

import type { AuthorizedMCP, SanitizedMCPPluginConfig } from '../../types.js'

import { buildMcpServer } from '../../mcp/buildMcpServer.js'
import { sanitizeMCPConfig } from '../../mcp/sanitizeMCPConfig.js'
import { getPluginConfig } from '../../utils/getPluginConfig.js'
import { resolveProjectRoot } from '../../utils/resolveProjectRoot.js'
import { watchConfig } from './watchConfig.js'

/**
 * Stdio adapter for the Payload MCP server.
 *
 * Do not use in production. There's no auth; whoever can spawn the process gets
 * full access to your local data.
 */
export const runMcpStdio = async (): Promise<void> => {
  /**
   * If MCP clients spawn stdio servers from an arbitrary working directory,
   * Payload's cwd-anchored `findConfig()` can't locate the project on
   * its own. This module always lives inside the project's `node_modules`, so
   * we derive the project root from its own path and `chdir` into it.
   *
   * An absolute `PAYLOAD_CONFIG_PATH` still overrides everything; unusual
   * layouts (e.g. a monorepo where the package is hoisted above the app) can
   * fall back to it. See the implementation of findConfig for details.
   */
  const projectRoot = resolveProjectRoot(fileURLToPath(import.meta.url))
  if (projectRoot) {
    process.chdir(projectRoot)
  }

  const configPath = findConfig()
  const configModule = await import(pathToFileURL(configPath).toString())
  const config = (await (configModule.default ?? configModule)) as MaybePromise<SanitizedConfig>

  const payload = await getPayload({ config })

  /**
   * If the user added `mcpPlugin({...})` to their `plugins` array, read the
   * sanitized config they registered. Otherwise fall back to the defaults. That way,
   * the mcp works on any project that has `@payloadcms/plugin-mcp` installed,
   * even if the plugin is not added to the plugins array.
   */
  let pluginConfig: SanitizedMCPPluginConfig
  try {
    pluginConfig = getPluginConfig({ config: payload.config })
  } catch {
    pluginConfig = sanitizeMCPConfig({ config: payload.config, pluginConfig: {} })

    const fakePluginFn: Plugin = (config) => config
    fakePluginFn.slug = '@payloadcms/plugin-mcp'
    // @ts-expect-error
    fakePluginFn.sanitizedOptions = pluginConfig

    // Push to payload config, to ensure consecutive calls to `getPluginConfig()` work
    ;(payload.config.plugins ??= []).push(fakePluginFn)
  }

  const authorizedMCP: AuthorizedMCP = {
    items: pluginConfig.items,
    overrideAccess: true,
    user: null,
  }

  const req = await createLocalReq({}, payload)
  req.payloadAPI = 'MCP' as const

  const { server } = buildMcpServer({ authorizedMCP, pluginConfig, req })

  const transport = new StdioServerTransport()
  await server.connect(transport)

  // Process now lives until stdin closes. Wire graceful shutdown so DB
  // connections (and any other Payload-managed resources) get released.
  const shutdown = async (code = 0) => {
    try {
      await server.close()
    } catch (err) {
      console.error('[payload-mcp] error closing server:', err)
    }
    try {
      await payload.destroy()
    } catch (err) {
      console.error('[payload-mcp] error destroying payload:', err)
    }
    process.exit(code)
  }

  process.on('SIGINT', () => void shutdown(0))
  process.on('SIGTERM', () => void shutdown(0))
  process.stdin.on('close', () => void shutdown(0))

  // The config is imported once at spawn. On change, exit so the MCP client
  // re-spawns us with the fresh config (and the new tool set). Dev-only.
  if (process.env.NODE_ENV !== 'production') {
    watchConfig({
      configPath,
      onChange: () => {
        console.error('[payload-mcp] config changed, restarting to refresh tools…')
        void shutdown(0)
      },
    })
  }
}
