import type { PayloadHandler, PayloadRequest } from 'payload'

import {
  isInitializeRequest,
  WebStandardStreamableHTTPServerTransport,
} from '@modelcontextprotocol/server'
import { randomUUID } from 'node:crypto'
import { APIError } from 'payload'

import { buildMcpServer, reconcileItems } from '../../mcp/buildMcpServer.js'
import { getPluginConfig } from '../../utils/getPluginConfig.js'
import { getAuthorizedMCP } from './access.js'
import { mcpSessions, sweepSessions } from './sessionStore.js'

const SESSION_ID_HEADER = 'mcp-session-id'

const jsonRpcError = (status: number, code: number, message: string): Response =>
  Response.json({ id: null, error: { code, message }, jsonrpc: '2.0' }, { status })

/**
 * Dev-only eager-reload poller.
 *
 * Payload's HMR is lazy: a config change makes Next push a websocket message that
 * sets `cached.reload = true`, but the actual `reload()` (which runs `onReload` →
 * `reconcileSessions` → `tools/list_changed`) only happens on the next `getPayload()`
 * call — i.e. the next request to hit the server. An agent that edits a config and
 * then checks its tool list never pokes the server, so the notification never fires
 * and the new collection's tools don't appear.
 *
 * This watches the pending-reload flag and, when set, pings the MCP endpoint to
 * force the lazy reload to run immediately. The result: `tools/list_changed` fires
 * within a few hundred ms of the edit, with no request from the agent.
 *
 * `pingUrl` is the live MCP endpoint URL (derived from an incoming request) so it
 * respects whatever API route prefix / origin the app uses. A `GET` with no session
 * returns 405, but it still runs `getPayload()`, which is all we need.
 */
const startEagerReloadPoller = (pingUrl: string): void => {
  const flags = globalThis as { __payloadMcpEagerReloadPoller?: boolean }
  if (flags.__payloadMcpEagerReloadPoller) {
    return
  }
  flags.__payloadMcpEagerReloadPoller = true

  const timer = setInterval(() => {
    // `_payload` is Payload's internal getPayload cache (keyed by instance, default 'default').
    const cache = (globalThis as { _payload?: Map<string, { reload?: unknown }> })._payload
    if (cache?.get('default')?.reload === true) {
      void fetch(pingUrl, { method: 'GET' }).catch(() => {})
    }
  }, 300)
  // Don't keep the process alive just for this poller.
  timer.unref?.()
}

const resolveServer = async (req: PayloadRequest) => {
  const pluginConfig = getPluginConfig({ config: req.payload.config })
  const authorizedMCP = await getAuthorizedMCP({ req })
  return buildMcpServer({ authorizedMCP, pluginConfig, req })
}

/**
 * Rebuild every live session's items against the current config and push
 * `tools/list_changed` to connected clients. Registered as an `onReload` hook so
 * a dev config change (HMR) refreshes clients without a restart or reconnect.
 */
export const reconcileSessions = async (): Promise<void> => {
  for (const session of mcpSessions.values()) {
    try {
      const authorizedMCP = await getAuthorizedMCP({ req: session.req })
      session.registry = reconcileItems({
        authorizedMCP,
        registry: session.registry,
        req: session.req,
        server: session.server,
      })
    } catch (error) {
      session.req.payload.logger.error({ err: error }, 'MCP: failed to reconcile session items')
    }
  }
}

/**
 * MCP HTTP endpoint for `POST` / `GET` / `DELETE` at `/api/mcp`.
 *
 * Stateless in production: every request is handled on a throwaway server, so it
 * works on serverless/multi-instance platforms (Vercel, Cloudflare, Lambda).
 *
 * Stateful in development (single long-lived process): the `initialize` handshake
 * opens a session and `GET` carries the notification stream. On a config change
 * (HMR) the plugin reconciles each session's tools and pushes `tools/list_changed`
 * (see reconcileSessions) so clients refresh without a restart or reconnect.
 */
export const mcpEndpoint: PayloadHandler = async (req) => {
  if (!req.url) {
    throw new APIError('Missing request URL', 400)
  }

  req.payloadAPI = 'MCP' as const

  // Sessions require shared in-memory state, which only holds on a single
  // long-lived process. Production may be serverless, so stay stateless there.
  const stateful = process.env.NODE_ENV !== 'production'

  // In dev, force pending HMR reloads to run eagerly so tool changes notify
  // connected clients without waiting for the next inbound request.
  if (stateful) {
    const { origin, pathname } = new URL(req.url)
    startEagerReloadPoller(`${origin}${pathname}`)
  }

  const method = (req.method ?? 'POST').toUpperCase()
  const hasBody = method !== 'GET' && method !== 'HEAD' && method !== 'DELETE'

  const mcpRequest = new Request(req.url, {
    headers: req.headers,
    method,
    ...(hasBody ? { body: req.body, duplex: 'half' } : {}),
  } as { duplex?: 'half' } & RequestInit)

  const sessionId = req.headers.get(SESSION_ID_HEADER) ?? undefined

  if (sessionId) {
    const session = mcpSessions.get(sessionId)
    // Unknown session: 404 so the client re-initializes (and re-lists tools).
    if (!session) {
      return jsonRpcError(404, -32001, 'Session not found')
    }
    session.lastAccess = Date.now()
    return await session.transport.handleRequest(mcpRequest)
  }

  let parsedBody: unknown
  if (hasBody) {
    try {
      parsedBody = await mcpRequest.json()
    } catch {
      parsedBody = undefined
    }
  }

  if (stateful && method === 'POST' && isInitializeRequest(parsedBody)) {
    const { registry, server } = await resolveServer(req)

    const transport = new WebStandardStreamableHTTPServerTransport({
      enableJsonResponse: true,
      onsessionclosed: (id) => {
        mcpSessions.delete(id)
      },
      onsessioninitialized: (id) => {
        sweepSessions()
        mcpSessions.set(id, { lastAccess: Date.now(), registry, req, server, transport })
      },
      sessionIdGenerator: () => randomUUID(),
    })

    await server.connect(transport)
    return await transport.handleRequest(mcpRequest, { parsedBody })
  }

  if (method === 'POST') {
    const { server } = await resolveServer(req)
    const transport = new WebStandardStreamableHTTPServerTransport({
      enableJsonResponse: true,
      sessionIdGenerator: undefined,
    })
    await server.connect(transport)
    return await transport.handleRequest(mcpRequest, { parsedBody })
  }

  return jsonRpcError(405, -32000, 'Method Not Allowed: missing session ID')
}
