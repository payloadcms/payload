import type { ProtocolEra } from '@modelcontextprotocol/client'

import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client'

import type { NextRESTClient } from '../../__helpers/shared/NextRESTClient.js'

/**
 * Connects a real MCP client and returns it after the initialize handshake.
 *
 * The integration tests run Payload in-process with no HTTP server, so the
 * transport's `fetch` calls the route handlers directly: POSTs to the `/mcp`
 * POST handler, and the client's optional GET stream to the GET handler (which
 * answers 405, telling the client there's no server-push stream).
 */
export async function connectMcpClient({
  apiKey,
  onResponse,
  protocolEra,
  restClient,
}: {
  apiKey: string
  onResponse?: (response: McpHTTPResponse) => void
  protocolEra: ProtocolEra
  restClient: NextRESTClient
}): Promise<Client> {
  const client = new Client(
    { name: 'plugin-mcp-tests', version: '1.0.0' },
    {
      versionNegotiation: {
        mode: protocolEra === 'modern' ? { pin: '2026-07-28' } : 'legacy',
      },
    },
  )
  const transport = new StreamableHTTPClientTransport(new URL('http://in-process/api/mcp'), {
    fetch: async (_url, init) => {
      const headers = new Headers(init?.headers)
      headers.set('Authorization', `users API-Key ${apiKey}`)
      const method = (init?.method ?? 'GET').toUpperCase()

      const response = await (method === 'POST'
        ? restClient.POST('/mcp', { body: init?.body as string, headers })
        : restClient.GET('/mcp', { headers }))

      onResponse?.({
        contentType: response.headers.get('content-type'),
        method,
        status: response.status,
      })

      return response
    },
  })

  await client.connect(transport)
  return client
}

export type McpHTTPResponse = {
  contentType: null | string
  method: string
  status: number
}
