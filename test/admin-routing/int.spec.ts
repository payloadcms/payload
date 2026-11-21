import type { AsyncLocalStorage } from 'node:async_hooks'

import { expect } from 'vitest'

import { payloadAdminSplatRoute } from '../../packages/tanstack-start/src/adapters/views/index.js'
import { test } from '../__helpers/int/vitest.js'

test.suite('Admin route search params', {}, () => {
  test('should read repeated query keys from the server router history', async () => {
    const indexedSearchStr = '?operation%5B0%5D=update&operation%5B1%5D=delete'
    const router = {
      history: { location: { search: '?operation=update&operation=delete' } },
      options: { parseSearch: () => ({}), stringifySearch: () => indexedSearchStr },
    }

    const search = await runInServerStartContext({
      getRouter: () => Promise.resolve(router),
      run: () => loadSearchParams({ searchStr: indexedSearchStr }),
    })

    expect(search).toEqual({ operation: ['update', 'delete'] })
  })

  test('should fall back to the location search without a router instance', async () => {
    const search = await loadSearchParams({ searchStr: '?operation%5B0%5D=update' })

    expect(search).toEqual({ 'operation[0]': 'update' })
  })
})

test.suite('Admin route cancellation', {}, () => {
  test('should forward router cancellation to a pending page load', async () => {
    const { abortController, loadSignal, navigation, resolve } = startNavigation()
    const reason = new Error('Navigation superseded')

    expect(loadSignal?.aborted).toBe(false)

    abortController.abort(reason)

    expect(loadSignal?.aborted).toBe(true)
    expect(loadSignal?.reason).toBe(reason)

    resolve({})
    await navigation
  })

  test('should preserve a returned page payload when the router cancels its loader', async () => {
    const { abortController, loadSignal, navigation, resolve } = startNavigation()
    const data = { rscPayload: { page: 'Returned page' } }

    resolve(data)

    await expect(navigation).resolves.toBe(data)

    abortController.abort()

    expect(loadSignal?.aborted).toBe(false)
  })

  test('should stop forwarding cancellation after a page load rejects', async () => {
    const { abortController, loadSignal, navigation, reject } = startNavigation()
    const error = new Error('Page load failed')

    reject(error)

    await expect(navigation).rejects.toBe(error)

    abortController.abort()

    expect(loadSignal?.aborted).toBe(false)
  })
})

function startNavigation() {
  const abortController = new AbortController()
  let loadSignal: AbortSignal | undefined
  let resolve!: (data: Record<string, unknown>) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<Record<string, unknown>>((resolveLoad, rejectLoad) => {
    resolve = resolveLoad
    reject = rejectLoad
  })
  const { loader } = payloadAdminSplatRoute({
    load: ({ signal }) => {
      loadSignal = signal
      return promise
    },
  })
  const navigation = loader.handler({
    abortController,
    location: { searchStr: '' },
    params: { _splat: 'collections/posts' },
  })

  return { abortController, loadSignal, navigation, reject, resolve }
}

async function loadSearchParams({ searchStr }: { searchStr: string }) {
  let search: unknown
  const { loader } = payloadAdminSplatRoute({
    load: ({ data }) => {
      search = data.search
      return Promise.resolve({})
    },
  })

  await loader.handler({
    abortController: new AbortController(),
    location: { searchStr },
    params: { _splat: 'collections/posts' },
  })

  return search
}

/**
 * Runs `run` the way a Start server request does. Every copy of Start shares
 * this AsyncLocalStorage through a global symbol, so the context reaches the
 * copy `@payloadcms/tanstack-start` resolves.
 */
function runInServerStartContext<T>({
  getRouter,
  run,
}: {
  getRouter: () => Promise<unknown>
  run: () => T
}): T {
  const startStorage = (globalThis as Record<symbol, AsyncLocalStorage<unknown>>)[
    Symbol.for('tanstack-start:start-storage-context')
  ]

  return startStorage.run({ getRouter }, run)
}
