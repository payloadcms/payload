/**
 * @vitest-environment jsdom
 */
import type { Root } from 'react-dom/client'

import { act, createElement, StrictMode, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  language: 'en',
  locale: 'en',
  requestGet: vi.fn(),
}))

vi.mock('../providers/Locale/index.js', () => ({
  useLocale: () => ({ code: mocks.locale }),
}))

vi.mock('../providers/Translation/index.js', () => ({
  useTranslation: () => ({ i18n: { language: mocks.language } }),
}))

vi.mock('../utilities/api.js', () => ({
  requests: { get: mocks.requestGet },
}))

import { usePayloadAPI } from './usePayloadAPI.js'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

type HarnessProps = {
  initialData?: unknown
  initialParams?: unknown
  nextParams?: unknown
  url: string
}

type PendingRequest = {
  resolve: (data: unknown) => void
  signal: AbortSignal
  url: string
}

const renderHarness = ({
  initialData,
  initialParams,
  isStrictMode = false,
  nextParams,
  root,
  url,
}: HarnessProps & {
  isStrictMode?: boolean
  root: Root
}) => {
  const harness = createElement(Harness, { initialData, initialParams, nextParams, url })

  root.render(isStrictMode ? createElement(StrictMode, null, harness) : harness)
}

const Harness = ({ initialData, initialParams, nextParams, url }: HarnessProps) => {
  const options = useMemo(() => ({ initialData, initialParams }), [initialData, initialParams])
  const [{ data, isError, isLoading }, { setParams }] = usePayloadAPI(url, options)

  return createElement(
    'div',
    null,
    createElement(
      'output',
      {
        'data-error': String(isError),
        'data-loading': String(isLoading),
      },
      JSON.stringify(data),
    ),
    createElement(
      'button',
      {
        onClick: () => setParams(nextParams),
        type: 'button',
      },
      'Set params',
    ),
  )
}

describe('usePayloadAPI', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    mocks.language = 'en'
    mocks.locale = 'en'
    mocks.requestGet.mockReset()

    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  it('should preserve initialData while StrictMode refreshes it asynchronously', async () => {
    const initialData = { source: 'initial' }
    const pendingRequests: PendingRequest[] = []

    mocks.requestGet.mockImplementation(
      (url: string, { signal }: { signal: AbortSignal }) =>
        new Promise((resolve, reject) => {
          const handleAbort = () => reject(new Error('Request aborted'))

          signal.addEventListener('abort', handleAbort, { once: true })
          pendingRequests.push({
            resolve: (data) => {
              signal.removeEventListener('abort', handleAbort)
              resolve({ json: async () => data, status: 200 })
            },
            signal,
            url,
          })
        }),
    )

    await act(async () => {
      renderHarness({
        initialData,
        isStrictMode: true,
        root,
        url: '/api/posts',
      })
    })

    expect(container.querySelector('output')?.textContent).toBe(JSON.stringify(initialData))
    expect(pendingRequests).toHaveLength(2)
    expect(pendingRequests[0]?.signal.aborted).toBe(true)
    expect(pendingRequests[1]?.signal.aborted).toBe(false)

    const freshData = { source: 'fresh' }

    await act(async () => {
      pendingRequests[1]?.resolve(freshData)
      await Promise.resolve()
    })

    expect(container.querySelector('output')?.textContent).toBe(JSON.stringify(freshData))
  })

  it('should refresh initialData asynchronously outside StrictMode', async () => {
    const initialData = { source: 'initial' }
    let resolveRequest: ((data: unknown) => void) | undefined

    mocks.requestGet.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = (data) => resolve({ json: async () => data, status: 200 })
        }),
    )

    await act(async () => {
      renderHarness({ initialData, root, url: '/api/posts' })
    })

    const output = container.querySelector('output')

    expect(output?.textContent).toBe(JSON.stringify(initialData))
    expect(output?.getAttribute('data-loading')).toBe('true')
    expect(mocks.requestGet).toHaveBeenCalledOnce()

    const freshData = { source: 'fresh' }

    await act(async () => {
      resolveRequest?.(freshData)
      await Promise.resolve()
    })

    expect(output?.textContent).toBe(JSON.stringify(freshData))
    expect(output?.getAttribute('data-loading')).toBe('false')
  })

  it('should update changed initialData without refetching', async () => {
    mocks.requestGet.mockImplementation(() => new Promise(() => undefined))

    await act(async () => {
      renderHarness({ initialData: { source: 'initial' }, root, url: '/api/posts' })
    })

    expect(mocks.requestGet).toHaveBeenCalledOnce()

    const updatedInitialData = { source: 'updated' }

    await act(async () => {
      renderHarness({ initialData: updatedInitialData, root, url: '/api/posts' })
    })

    expect(container.querySelector('output')?.textContent).toBe(JSON.stringify(updatedInitialData))
    expect(mocks.requestGet).toHaveBeenCalledOnce()
  })

  it('should refetch when params, URL, or locale change', async () => {
    const initialParams = { page: 1 }
    const nextParams = { page: 2 }

    mocks.requestGet.mockImplementation(async (url: string) => ({
      json: async () => ({ url }),
      status: 200,
    }))

    await act(async () => {
      renderHarness({ initialParams, nextParams, root, url: '/api/posts' })
    })

    expect(mocks.requestGet.mock.calls[0]?.[0]).toBe('/api/posts?locale=en&page=1')

    await act(async () => {
      container.querySelector('button')?.click()
    })

    expect(mocks.requestGet.mock.calls[1]?.[0]).toBe('/api/posts?locale=en&page=2')

    await act(async () => {
      renderHarness({ initialParams, nextParams, root, url: '/api/comments' })
    })

    expect(mocks.requestGet.mock.calls[2]?.[0]).toBe('/api/comments?locale=en&page=2')

    mocks.locale = 'de'

    await act(async () => {
      renderHarness({ initialParams, nextParams, root, url: '/api/comments' })
    })

    expect(mocks.requestGet.mock.calls[3]?.[0]).toBe('/api/comments?locale=de&page=2')
  })
})
