import type { PayloadRequest } from 'payload'

import {
  CLIENT_CAPABILITIES_META_KEY,
  CLIENT_INFO_META_KEY,
  DEFAULT_MAX_REQUEST_BODY_SIZE,
  McpServer,
  PROTOCOL_VERSION_META_KEY,
} from '@modelcontextprotocol/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { mcpEndpoint } from './index.js'

const { pluginConfig } = vi.hoisted(() => ({
  pluginConfig: { mcp: { maxRequestBodySize: undefined as number | undefined } },
}))

vi.mock('../utils/getPluginConfig.js', () => ({ getPluginConfig: () => pluginConfig }))
vi.mock('./access.js', () => ({ getAuthorizedMCP: () => ({ items: [], overrideAccess: false }) }))
vi.mock('../mcp/buildMcpServer.js', () => ({
  buildMcpServer: () => {
    const server = new McpServer({ name: 'request-body-test', version: '1.0.0' })

    server.registerTool('body-test', { description: 'Body parsing test', inputSchema: {} }, () => ({
      content: [],
    }))

    return server
  },
}))

describe('MCP request bodies', () => {
  beforeEach(() => {
    pluginConfig.mcp.maxRequestBodySize = undefined
  })

  describe.each(['legacy', 'modern'] as const)('%s protocol', (protocolEra) => {
    it('should accept a body exactly at the default byte limit without cloning it', async () => {
      const body = paddedBody({ protocolEra, size: DEFAULT_MAX_REQUEST_BODY_SIZE })
      const request = createRequest({ body, protocolEra })
      const clone = vi.spyOn(request, 'clone')
      const response = await mcpEndpoint(request)

      expect(response.status).toBe(200)
      expect(clone).not.toHaveBeenCalled()
      expect(await response.json()).toMatchObject({
        id: 1,
        result: { tools: [{ name: 'body-test' }] },
      })
    })

    it('should reject a body one byte over the default limit', async () => {
      const body = paddedBody({ protocolEra, size: DEFAULT_MAX_REQUEST_BODY_SIZE + 1 })
      const response = await mcpEndpoint(createRequest({ body, protocolEra }))

      expect(response.status).toBe(413)
      expect(await response.json()).toEqual({
        error: {
          code: -32000,
          message: `Payload Too Large: Request body must not exceed ${DEFAULT_MAX_REQUEST_BODY_SIZE} bytes`,
        },
        id: null,
        jsonrpc: '2.0',
      })
    })

    it('should accept a body above the default limit when configured with a higher limit', async () => {
      pluginConfig.mcp.maxRequestBodySize = DEFAULT_MAX_REQUEST_BODY_SIZE + 1

      const body = paddedBody({ protocolEra, size: DEFAULT_MAX_REQUEST_BODY_SIZE + 1 })
      const response = await mcpEndpoint(createRequest({ body, protocolEra }))

      expect(response.status).toBe(200)
    })

    it('should enforce a lower custom limit on a chunked body without Content-Length', async () => {
      pluginConfig.mcp.maxRequestBodySize = 512

      const body = paddedBody({ protocolEra, size: 4096 })
      const request = createRequest({ body, protocolEra, shouldStream: true })
      const response = await mcpEndpoint(request)

      expect(request.headers.has('content-length')).toBe(false)
      expect(response.status).toBe(413)
      expect(await response.json()).toMatchObject({
        error: { message: 'Payload Too Large: Request body must not exceed 512 bytes' },
      })
    })

    it('should accept a chunked body exactly at a lower custom limit', async () => {
      pluginConfig.mcp.maxRequestBodySize = 512

      const body = paddedBody({ protocolEra, size: 512 })
      const response = await mcpEndpoint(createRequest({ body, protocolEra, shouldStream: true }))

      expect(response.status).toBe(200)
    })

    it('should reject an oversized Content-Length without reading the body', async () => {
      const request = createRequest({ body: '{', protocolEra })
      const getReader = vi.spyOn(request.body!, 'getReader')

      request.headers.set('Content-Length', String(DEFAULT_MAX_REQUEST_BODY_SIZE + 1))

      const response = await mcpEndpoint(request)

      expect(response.status).toBe(413)
      expect(getReader).not.toHaveBeenCalled()
    })

    it.each(['', '{', 'null'])('should reject invalid JSON-RPC body %j', async (body) => {
      const request = createRequest({ body, protocolEra })
      const clone = vi.spyOn(request, 'clone')
      const response = await mcpEndpoint(request)

      expect(response.status).toBe(400)
      expect(await response.json()).toMatchObject({
        error: { code: body === 'null' ? -32600 : -32700 },
        id: null,
      })
      expect(clone).not.toHaveBeenCalled()
    })

    it('should preserve the media-type rejection for an oversized body', async () => {
      pluginConfig.mcp.maxRequestBodySize = 1

      const request = createRequest({ body: '{}', protocolEra })

      request.headers.set('Content-Type', 'text/plain')

      const response = await mcpEndpoint(request)

      expect(response.status).toBe(415)
    })

    it('should preserve the legacy Accept rejection for malformed JSON', async () => {
      const request = createRequest({ body: '{', protocolEra })

      request.headers.set('Accept', 'application/json')
      request.headers.set('Content-Type', 'text/plain')

      const response = await mcpEndpoint(request)

      expect(response.status).toBe(406)
    })

    it('should return a parse error when the body stream fails', async () => {
      const request = createRequest({
        body: new ReadableStream({
          start(controller) {
            controller.error(new Error('broken stream'))
          },
        }),
        protocolEra,
      })
      const response = await mcpEndpoint(request)

      expect(response.status).toBe(400)
      expect(await response.json()).toMatchObject({ error: { code: -32700 } })
    })
  })

  it('should measure UTF-8 bytes rather than characters', async () => {
    pluginConfig.mcp.maxRequestBodySize = 2

    const response = await mcpEndpoint(createRequest({ body: '"é"', protocolEra: 'legacy' }))

    expect(response.status).toBe(413)
  })
})

const paddedBody = ({
  protocolEra,
  size,
}: {
  protocolEra: 'legacy' | 'modern'
  size: number
}): string => {
  const body = JSON.stringify({
    id: 1,
    jsonrpc: '2.0',
    method: 'tools/list',
    params:
      protocolEra === 'modern'
        ? {
            _meta: {
              [CLIENT_CAPABILITIES_META_KEY]: {},
              [CLIENT_INFO_META_KEY]: { name: 'request-body-test', version: '1.0.0' },
              [PROTOCOL_VERSION_META_KEY]: '2026-07-28',
            },
          }
        : {},
  })

  return body.padEnd(size, ' ')
}

const createRequest = ({
  body,
  protocolEra,
  shouldStream = false,
}: {
  body: ReadableStream<Uint8Array> | string
  protocolEra: 'legacy' | 'modern'
  shouldStream?: boolean
}): PayloadRequest & Request => {
  const bytes = typeof body === 'string' ? new TextEncoder().encode(body) : undefined
  let offset = 0
  const requestBody =
    shouldStream && bytes
      ? new ReadableStream<Uint8Array>({
          pull(controller) {
            if (offset >= bytes.length) {
              controller.close()
              return
            }

            controller.enqueue(bytes.slice(offset, offset + 256))
            offset += 256
          },
        })
      : body
  const request = new Request('http://localhost/api/mcp', {
    body: requestBody,
    headers: {
      Accept: 'application/json, text/event-stream',
      'Content-Type': 'application/json',
      ...(protocolEra === 'modern'
        ? { 'MCP-Protocol-Version': '2026-07-28', 'Mcp-Method': 'tools/list' }
        : {}),
    },
    method: 'POST',
    ...(typeof requestBody === 'string' ? {} : { duplex: 'half' }),
  })

  return Object.assign(request, {
    payload: { config: {}, logger: { error: vi.fn() } },
  }) as unknown as PayloadRequest & Request
}
