import { describe, expect, it } from 'vitest'

import { createRequestFromPayloadRequest } from './createRequest.js'

describe('createRequestFromPayloadRequest', () => {
  it('does not pass a body for GET requests', () => {
    const request = createRequestFromPayloadRequest({
      body: 'should-not-be-sent',
      headers: new Headers(),
      method: 'GET',
      url: 'http://localhost:3000/api/mcp',
    } as Parameters<typeof createRequestFromPayloadRequest>[0])

    expect(request.method).toBe('GET')
    expect(request.body).toBeNull()
  })

  it('does not pass a body for HEAD requests', () => {
    const request = createRequestFromPayloadRequest({
      body: 'should-not-be-sent',
      headers: new Headers(),
      method: 'HEAD',
      url: 'http://localhost:3000/api/mcp',
    } as Parameters<typeof createRequestFromPayloadRequest>[0])

    expect(request.method).toBe('HEAD')
    expect(request.body).toBeNull()
  })

  it('passes body and duplex for POST requests', () => {
    const body = JSON.stringify({ jsonrpc: '2.0', method: 'initialize', id: 1 })

    const request = createRequestFromPayloadRequest({
      body,
      headers: new Headers({ 'content-type': 'application/json' }),
      method: 'POST',
      url: 'http://localhost:3000/api/mcp',
    } as Parameters<typeof createRequestFromPayloadRequest>[0])

    expect(request.method).toBe('POST')
    expect(request.body).not.toBeNull()
  })
})
