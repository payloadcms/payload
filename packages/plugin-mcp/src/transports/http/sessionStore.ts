import type {
  McpServer,
  WebStandardStreamableHTTPServerTransport,
} from '@modelcontextprotocol/server'
import type { PayloadRequest } from 'payload'

import type { ItemRegistry } from '../../mcp/buildMcpServer.js'

export type McpSession = {
  lastAccess: number
  // `req` and `registry` are kept so the session's items can be rebuilt on a
  // config reload (see reconcileSessions).
  registry: ItemRegistry
  req: PayloadRequest
  server: McpServer
  transport: WebStandardStreamableHTTPServerTransport
}

const IDLE_TIMEOUT = 1000 * 60 * 30

// Pinned to globalThis so dev HMR (module re-eval) doesn't orphan live sessions.
const globalForSessions = globalThis as {
  __payloadMcpSessions?: Map<string, McpSession>
} & typeof globalThis

export const mcpSessions: Map<string, McpSession> = (globalForSessions.__payloadMcpSessions ??=
  new Map())

// Close idle sessions. Called before opening a new one so the store stays bounded.
export const sweepSessions = (): void => {
  const now = Date.now()
  for (const [id, session] of mcpSessions) {
    if (now - session.lastAccess > IDLE_TIMEOUT) {
      mcpSessions.delete(id)
      void session.server.close().catch(() => {})
    }
  }
}
