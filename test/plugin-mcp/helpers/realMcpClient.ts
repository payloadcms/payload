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
  restClient,
}: {
  apiKey: string
  restClient: NextRESTClient
}): Promise<Client> {
  const client = new Client({ name: 'plugin-mcp-tests', version: '1.0.0' })
  const transport = new StreamableHTTPClientTransport(new URL('http://in-process/api/mcp'), {
    fetch: (_url, init) => {
      const headers = new Headers(init?.headers)
      headers.set('Authorization', `users API-Key ${apiKey}`)

      return (init?.method ?? 'GET').toUpperCase() === 'POST'
        ? restClient.POST('/mcp', { body: init?.body as string, headers })
        : restClient.GET('/mcp', { headers })
    },
  })

  await client.connect(transport)
  return client
}
