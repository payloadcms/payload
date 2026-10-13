import type { Endpoint } from 'payload'

import { requestHandler } from '@tanstack/react-start/server'
import assert from 'node:assert/strict'
import { createPayloadRequest } from 'payload'

import { tanstackServerAdapter } from '../../packages/tanstack-start/src/adapters/server.js'
import { test } from '../__helpers/int/vitest.js'

const endpoint: Endpoint = {
  handler: async () => {
    await tanstackServerAdapter.setCookie('first-cookie', 'first-value', { path: '/' })
    await tanstackServerAdapter.setCookie('second-cookie', 'second-value', { path: '/' })

    return Response.json({ ok: true })
  },
  method: 'get',
  path: '/set-two-cookies',
}

test.suite('TanStack server adapter', { config: './config.ts' }, () => {
  test('should preserve multiple cookies in one response', async ({ payload }) => {
    const req = await createPayloadRequest({ payload })
    const handleRequest = requestHandler(() => endpoint.handler(req))
    const response = await handleRequest(new Request('http://localhost/api/set-two-cookies'), {})

    assert.equal(response.status, 200)
    assert.deepEqual(response.headers.getSetCookie(), [
      'first-cookie=first-value; Path=/',
      'second-cookie=second-value; Path=/',
    ])
  })
})
