import type { ServerContext } from '@modelcontextprotocol/server'
import type { Payload } from 'payload'

import { CLIENT_INFO_META_KEY, PROTOCOL_VERSION_META_KEY } from '@modelcontextprotocol/server'
import { sendTelemetryEvent } from 'payload/internal'

import type { AuthorizedMCP, MCPItem, MCPToolResponse } from '../types.js'

import {
  COLLECTION_AUTH_BUILTINS,
  COLLECTION_BUILTINS,
  GLOBAL_BUILTINS,
  TOOL_BUILTINS,
} from '../mcp/builtinTools.js'

export type MCPTransport = 'http' | 'stdio'

/**
 * The MCP telemetry events. `mcp-connection` fires once per connection — its client
 * and protocol fields are only known on the modern (2026-07-28+) era, so a
 * `legacy` connection reports them null.
 */
type MCPTelemetryEvent =
  | {
      authenticated: boolean
      clientName: null | string
      clientVersion: null | string
      protocolPath: 'legacy' | 'modern'
      protocolVersion: null | string
      transport: MCPTransport
      type: 'mcp-connection'
    }
  | { isError: boolean; tool: string; transport: MCPTransport; type: 'mcp-tool-call' }

/**
 * Returns a wrapper for MCP tool handlers that emits telemetry: a one-time
 * `mcp-connection` for the connection, then a `mcp-tool-call` per invocation. Client
 * and protocol data are read from the request's `_meta` envelope, which only
 * the modern era carries — so the SDK's deprecated accessors are never used.
 */
export const createMcpServerTelemetry = ({
  authorizedMCP,
  payload,
  transport,
}: {
  authorizedMCP: AuthorizedMCP
  payload: Payload
  transport: MCPTransport
}) => {
  const send = (event: MCPTelemetryEvent) => void sendTelemetryEvent({ event, payload })

  let hasReportedConnection = false

  const reportConnectionOnce = (ctx: ServerContext): void => {
    if (hasReportedConnection) {
      return
    }
    hasReportedConnection = true

    const envelope = ctx?.mcpReq?.envelope
    const clientInfo = envelope?.[CLIENT_INFO_META_KEY]

    send({
      type: 'mcp-connection',
      authenticated: Boolean(authorizedMCP.user),
      clientName: clientInfo?.name ?? null,
      clientVersion: clientInfo?.version ?? null,
      protocolPath: envelope ? 'modern' : 'legacy',
      protocolVersion: envelope?.[PROTOCOL_VERSION_META_KEY] ?? null,
      transport,
    })
  }

  return (
    item: MCPItem,
    handler: (input: unknown, ctx: ServerContext) => Promise<MCPToolResponse>,
  ) => {
    const tool = getTelemetryToolName(item)
    // Tools with an input schema are invoked as `(input, ctx)`, tools without one
    // as `(ctx)` — so the server context is always the final argument.
    return async (...args: unknown[]): Promise<MCPToolResponse> => {
      reportConnectionOnce(args[args.length - 1] as ServerContext)
      try {
        const response = await handler(...(args as [unknown, ServerContext]))
        send({ type: 'mcp-tool-call', isError: Boolean(response.isError), tool, transport })
        return response
      } catch (err) {
        send({ type: 'mcp-tool-call', isError: true, tool, transport })
        throw err
      }
    }
  }
}

/**
 * Built-in tools report their wire name (e.g. `createDocument`); user-defined
 * tools collapse to `custom` so their names never reach telemetry. Keyed on
 * `configKey`, not `mcpName`, so a custom tool sharing a built-in wire name
 * still reports `custom`.
 */
export const getTelemetryToolName = (item: MCPItem): string => {
  const isBuiltin =
    item.type === 'tool'
      ? item.configKey in TOOL_BUILTINS
      : item.type === 'collectionTool'
        ? item.configKey in COLLECTION_BUILTINS || item.configKey in COLLECTION_AUTH_BUILTINS
        : item.configKey in GLOBAL_BUILTINS

  return isBuiltin ? item.mcpName : 'custom'
}
