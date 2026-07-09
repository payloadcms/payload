import type { Client, ProtocolEra } from '@modelcontextprotocol/client'

import type { NextRESTClient } from '../../__helpers/shared/NextRESTClient.js'
import type { McpHTTPResponse } from './realMcpClient.js'

import { connectMcpClient } from './realMcpClient.js'

export type McpClient = {
  /** Disconnects every client opened during the test. */
  close: () => Promise<void>
  /** Returns a connected MCP client for the given API key (one per key, reused). */
  connect: (apiKey: string) => Promise<Client>
  /** Returns the HTTP responses observed by the real MCP transport. */
  getHTTPResponses: () => McpHTTPResponse[]
  /** Sends a raw POST to `/mcp` — for the auth/malformed-request tests a real client can't make. */
  rawPost: (args: { apiKey?: string; body: unknown }) => Promise<Response>
}

export function createMcpClient({
  protocolEra,
  restClient,
}: {
  protocolEra: ProtocolEra
  restClient: NextRESTClient
}): McpClient {
  // One connected client per API key — the handshake runs once, then reused.
  const clients = new Map<string, Promise<Client>>()
  const httpResponses: McpHTTPResponse[] = []

  return {
    close: async () => {
      const pending = [...clients.values()]
      clients.clear()
      await Promise.all(
        pending.map(async (client) => {
          try {
            await (await client).close()
          } catch {
            // Best-effort teardown — a failed handshake leaves nothing to close.
          }
        }),
      )
    },
    connect: (apiKey) => {
      let client = clients.get(apiKey)
      if (!client) {
        client = connectMcpClient({
          apiKey,
          onResponse: (response) => httpResponses.push(response),
          protocolEra,
          restClient,
        })
        clients.set(apiKey, client)
      }
      return client
    },
    getHTTPResponses: () => [...httpResponses],
    rawPost: async ({ apiKey, body }) =>
      restClient.POST('/mcp', {
        body: JSON.stringify(body),
        headers: {
          Accept: 'application/json, text/event-stream',
          ...(apiKey ? { Authorization: `users API-Key ${apiKey}` } : {}),
          'Content-Type': 'application/json',
        },
      }),
  }
}

/** A tool/call result's content — what `client.callTool()` returns. */
type ToolResult = { content?: Array<{ text?: string }> }

/**
 * Returns the first text content block from a tool/call result.
 */
export function getToolText(result: ToolResult): string {
  const text = result.content?.[0]?.text
  if (typeof text !== 'string') {
    throw new Error(`MCP tool result has no text content: ${JSON.stringify(result, null, 2)}`)
  }
  return text
}

/**
 * Extracts the JSON document block (```json ... ```) from a tool/call result.
 */
export function getToolDoc<T = Record<string, unknown>>(result: ToolResult): T {
  const text = getToolText(result)
  const match = text.match(/```json\n([\s\S]*?)\n```/)
  if (!match) {
    throw new Error(`MCP tool result text contained no \`\`\`json block: ${text}`)
  }
  return JSON.parse(match[1]!) as T
}
