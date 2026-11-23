import { expect } from 'vitest'

import { payloadAdminSplatRoute } from '../../packages/tanstack-start/src/adapters/views/index.js'
import { test } from '../__helpers/int/vitest.js'

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
