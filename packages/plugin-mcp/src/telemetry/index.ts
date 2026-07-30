import type { Implementation, McpServer, ServerContext } from '@modelcontextprotocol/server'
import type { PayloadRequest } from 'payload'

import { CLIENT_INFO_META_KEY, PROTOCOL_VERSION_META_KEY } from '@modelcontextprotocol/server'
import { sendTelemetryEvent } from 'payload/internal'

import type { MCPItem, MCPToolResponse } from '../types.js'

import { MCP_TOOL_TELEMETRY_MARKER } from '../types.js'
import { getMcpErrorType, type MCPErrorType } from './errorType.js'

type ModernRequestEnvelope = {
  [CLIENT_INFO_META_KEY]?: Implementation
  [PROTOCOL_VERSION_META_KEY]?: string
}

export const createMcpServerTelemetry = ({
  req,
  server,
}: {
  req: PayloadRequest
  server: McpServer
}) => {
  const reportToolCall = ({
    ctx,
    errorType,
    tool,
  }: {
    ctx: ServerContext
    errorType: MCPErrorType | null
    tool: string
  }): void => {
    const envelope = ctx.mcpReq.envelope as ModernRequestEnvelope | undefined
    const clientInfo = envelope?.[CLIENT_INFO_META_KEY] ?? server.server.getClientVersion()

    void sendTelemetryEvent({
      event: {
        type: 'mcp-tool-call',
        authenticated: Boolean(req.user),
        clientName: clientInfo?.name ?? null,
        clientVersion: clientInfo?.version ?? null,
        errorType,
        isError: errorType !== null,
        protocolPath: envelope ? 'modern' : 'legacy',
        protocolVersion:
          envelope?.[PROTOCOL_VERSION_META_KEY] ??
          server.server.getNegotiatedProtocolVersion() ??
          null,
        tool,
        transport: ctx.http?.req ? 'http' : 'stdio',
      },
      payload: req.payload,
    })
  }

  return (
    item: MCPItem,
    handler: (input: unknown, ctx: ServerContext) => Promise<MCPToolResponse>,
  ) => {
    const tool = getTelemetryToolName(item)
    // Tools with an input schema are invoked as `(input, ctx)`, tools without one
    // as `(ctx)` - so the server context is always the final argument.
    return async (...args: unknown[]): Promise<MCPToolResponse> => {
      const ctx = args[args.length - 1] as ServerContext
      const input = args.length > 1 ? args[0] : undefined

      try {
        const response = await handler(input, ctx)
        reportToolCall({
          ctx,
          errorType: response.isError ? getMcpErrorType({ response }) : null,
          tool,
        })
        return response
      } catch (err) {
        reportToolCall({ ctx, errorType: 'internal', tool })
        throw err
      }
    }
  }
}

// Do not send user-defined tool names to telemetry.
export const getTelemetryToolName = (item: MCPItem): string =>
  'tool' in item && item.tool[MCP_TOOL_TELEMETRY_MARKER] === true ? item.mcpName : 'custom'
