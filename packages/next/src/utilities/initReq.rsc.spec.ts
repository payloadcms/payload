import type { ImportMap, SanitizedConfig } from 'payload'

import { createRequire } from 'node:module'

import type React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { initReq } from './initReq.js'

const { counters, payloadInitReq } = vi.hoisted(() => ({
  counters: {
    partial: 0,
    request: 0,
  },
  payloadInitReq: vi.fn(),
}))

vi.mock('react', () => createRequire(import.meta.url)('react'))

vi.mock('payload', () => ({
  initReq: payloadInitReq,
}))

vi.mock('../adapters/server.js', () => ({
  nextServerAdapter: {
    getHeaders: vi.fn(),
  },
}))

type RscRenderer = {
  renderToReadableStream: (
    model: React.ReactNode,
    moduleMap: Record<string, unknown>,
  ) => ReadableStream<Uint8Array>
}

const require = createRequire(import.meta.url)
const React = require('react') as typeof import('react')
const { renderToReadableStream } =
  require('next/dist/compiled/react-server-dom-webpack/server.node.js') as RscRenderer

const configPromise = Promise.resolve({} as SanitizedConfig)
const importMap = {} as ImportMap

async function renderNavigation(): Promise<void> {
  async function Navigation() {
    await Promise.all([
      initReq({ configPromise, importMap, key: 'RootLayout' }),
      initReq({ configPromise, importMap, key: 'RootLayout' }),
      initReq({ configPromise, importMap, key: 'initPage' }),
    ])

    return null
  }

  const stream = renderToReadableStream(React.createElement(Navigation), {})

  await new Response(stream).arrayBuffer()
}

describe('Next initReq RSC cache', () => {
  beforeEach(() => {
    counters.partial = 0
    counters.request = 0
    payloadInitReq.mockReset().mockImplementation(async ({ cache, key }) => {
      await cache.getPartial(async () => {
        counters.partial += 1
        return {}
      })

      return cache.getRequest(async () => {
        counters.request += 1
        return {}
      }, key)
    })
  })

  it('should deduplicate initialization per navigation and reset between navigations', async () => {
    await renderNavigation()

    expect(counters).toEqual({
      partial: 1,
      request: 2,
    })

    await renderNavigation()

    expect(counters).toEqual({
      partial: 2,
      request: 4,
    })
  })
})
