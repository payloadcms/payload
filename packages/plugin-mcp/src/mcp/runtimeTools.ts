import type { ServerContext } from '@modelcontextprotocol/server'
import type { MaybePromise, PayloadRequest } from 'payload'

import type { MCPToolResponse } from '../types.js'

/**
 * A tool registered at runtime rather than derived from the Payload config.
 *
 * Unlike config-derived tools, runtime tools are stored here so they're re-applied
 * to every server built afterwards — new sessions and post-HMR reconciles alike.
 * That's what lets a runtime tool survive an MCP client reload.
 */
export type RuntimeTool = {
  description?: string
  /** What the tool returns when called. `doc` is stripped before going on the wire. */
  handler: (args: {
    input: Record<string, unknown>
    req: PayloadRequest
    serverContext: ServerContext
  }) => MaybePromise<MCPToolResponse>
  /** Wire name of the tool, e.g. `gaga`. */
  name: string
  title?: string
}

// Pinned to globalThis so dev HMR (module re-eval) doesn't drop registered runtime
// tools, mirroring how live sessions are pinned in `sessionStore.ts`.
const globalForRuntimeTools = globalThis as {
  __payloadMcpRuntimeTools?: Map<string, RuntimeTool>
} & typeof globalThis

/** Runtime tools keyed by name. Read by `registerItems` when building any server. */
export const runtimeTools: Map<string, RuntimeTool> =
  (globalForRuntimeTools.__payloadMcpRuntimeTools ??= new Map())
