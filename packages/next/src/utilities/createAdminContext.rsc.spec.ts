import type { ImportMap, SanitizedConfig } from 'payload'

import { createRequire } from 'node:module'

import type React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createAdminContext } from './createAdminContext.js'

const { counters, createPayloadAdminContext } = vi.hoisted(() => ({
  counters: {
    locale: 0,
    partial: 0,
    request: 0,
  },
  createPayloadAdminContext: vi.fn(),
}))

vi.mock('react', () => createRequire(import.meta.url)('react'))

vi.mock('payload/internal', () => ({
  createAdminContext: createPayloadAdminContext,
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
      createAdminContext({ configPromise, importMap, key: 'RootLayout' }),
      createAdminContext({ configPromise, importMap, key: 'RootLayout' }),
      createAdminContext({ configPromise, importMap, key: 'initPage' }),
    ])

    return null
  }

  const stream = renderToReadableStream(React.createElement(Navigation), {})

  await new Response(stream).arrayBuffer()
}

async function renderNavigationWithOverrides(): Promise<void> {
  async function Navigation() {
    await Promise.all([
      createAdminContext({
        configPromise,
        importMap,
        key: 'initPage',
        overrides: { context: { source: 'first' } },
      }),
      createAdminContext({
        configPromise,
        importMap,
        key: 'initPage',
        overrides: { context: { source: 'second' } },
      }),
    ])

    return null
  }

  const stream = renderToReadableStream(React.createElement(Navigation), {})

  await new Response(stream).arrayBuffer()
}

describe('Next createAdminContext RSC cache', () => {
  beforeEach(() => {
    counters.locale = 0
    counters.partial = 0
    counters.request = 0
    createPayloadAdminContext.mockReset().mockImplementation(async ({ cache, key, overrides }) => {
      await cache.getPartial(async () => {
        counters.partial += 1
        return {}
      })

      return cache.getRequest(
        async () => {
          counters.request += 1

          if (cache.getLocale) {
            await cache.getLocale(
              async () => {
                counters.locale += 1
                return { locale: undefined }
              },
              'payload',
              'users',
              'user-id',
              undefined,
            )
          }

          return {}
        },
        key,
        overrides,
      )
    })
  })

  it('should deduplicate initialization per navigation and reset between navigations', async () => {
    await renderNavigation()

    expect(counters).toEqual({
      locale: 1,
      partial: 1,
      request: 2,
    })

    await renderNavigation()

    expect(counters).toEqual({
      locale: 2,
      partial: 2,
      request: 4,
    })
  })

  it('should isolate requests with the same key and different overrides', async () => {
    await renderNavigationWithOverrides()

    expect(counters).toEqual({
      locale: 1,
      partial: 1,
      request: 2,
    })
  })
})
