import type { RuntimeTool } from '../../mcp/runtimeTools.js'

import { registerRuntimeToolOnServer } from '../../mcp/buildMcpServer.js'
import { runtimeTools } from '../../mcp/runtimeTools.js'
import { mcpSessions } from './sessionStore.js'

/**
 * Register a tool at runtime and push `tools/list_changed`.
 *
 * The tool is persisted in the runtime store so future servers (new sessions and
 * post-HMR reconciles) include it — that's what lets it survive an MCP client
 * reload. It's also applied to every currently-live session immediately, so
 * connected clients can pick it up from the notification without reconnecting.
 *
 * Re-adding an existing name replaces it (handy for iterating in a test page).
 *
 * @returns the number of live sessions the tool was applied to.
 */
export const addRuntimeTool = (tool: RuntimeTool): { liveSessions: number } => {
  runtimeTools.set(tool.name, tool)

  const registryKey = `runtimeTool:${tool.name}`
  let liveSessions = 0

  for (const session of mcpSessions.values()) {
    try {
      // Drop a prior registration of the same name so re-adding updates it
      // instead of throwing "Tool already registered".
      session.registry.get(registryKey)?.remove()
      session.registry.delete(registryKey)

      // registerTool (and the remove() above) already emit tools/list_changed,
      // so no explicit notification is needed here.
      const registration = registerRuntimeToolOnServer({
        req: session.req,
        server: session.server,
        tool,
      })
      session.registry.set(registryKey, registration)
      liveSessions++
    } catch (error) {
      session.req.payload.logger.error(
        { err: error },
        `MCP: failed to add runtime tool "${tool.name}" to a live session`,
      )
    }
  }

  return { liveSessions }
}
