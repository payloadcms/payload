// @vitest-environment jsdom
import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { UploadInput } from './Input.js'

vi.mock('@faceless-ui/modal', () => ({
  useModal: () => ({ openModal: vi.fn() }),
}))

vi.mock('../../elements/BulkUpload/index.js', () => ({
  useBulkUpload: () => ({
    modalSlug: 'bulk-upload',
    setCollectionSlug: vi.fn(),
    setInitialFiles: vi.fn(),
    setMaxFiles: vi.fn(),
    setOnSuccess: vi.fn(),
    setSelectableCollections: vi.fn(),
  }),
}))

vi.mock('../../elements/DocumentDrawer/index.js', () => ({
  useDocumentDrawer: () => [() => null, () => null, { closeDrawer: vi.fn(), openDrawer: vi.fn() }],
}))

vi.mock('../../elements/ListDrawer/index.js', () => ({
  useListDrawer: () => [() => null, () => null, { closeDrawer: vi.fn(), openDrawer: vi.fn() }],
}))

vi.mock('../../providers/Auth/index.js', () => ({
  useAuth: () => ({ permissions: {} }),
}))

vi.mock('../../providers/Locale/index.js', () => ({
  useLocale: () => ({ code: 'en' }),
}))

vi.mock('../../providers/Translation/index.js', () => ({
  useTranslation: () => ({ i18n: { language: 'en' }, t: (key: string) => key }),
}))

vi.mock('./HasMany/index.js', () => ({
  UploadComponentHasMany: (props: { fileDocs: unknown }) =>
    React.createElement('div', { 'data-testid': 'has-many' }, JSON.stringify(props.fileDocs)),
}))

vi.mock('./HasOne/index.js', () => ({
  UploadComponentHasOne: () => null,
}))

const rootCleanups: Array<() => void> = []

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  for (const cleanup of rootCleanups.splice(0)) {
    cleanup()
  }
  vi.unstubAllGlobals()
})

describe('UploadInput populateDocs race', () => {
  it('does not let a stale populateDocs() result overwrite a newer value', async () => {
    let oldRequest: ReturnType<typeof createDeferred<Response>> | undefined
    let newRequest: ReturnType<typeof createDeferred<Response>> | undefined

    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>
    fetchMock.mockImplementation((_url: string, options: { body: string }) => {
      const deferred = createDeferred<Response>()
      if (options.body.includes('old-id')) {
        oldRequest = deferred
      } else {
        newRequest = deferred
      }
      return deferred.promise
    })

    const { container, rerender } = renderUploadInput({ value: ['old-id'] })

    // First render fires populateDocs() for the older value; do not resolve it yet.
    await act(async () => {
      await Promise.resolve()
    })
    expect(oldRequest).toBeDefined()

    // A newer value supersedes it before the older request resolves.
    rerender({ value: ['new-id'] })
    await act(async () => {
      await Promise.resolve()
    })
    expect(newRequest).toBeDefined()

    // The newer request resolves first and is applied.
    await act(async () => {
      newRequest!.resolve(jsonResponse([{ id: 'new-id', filename: 'new.jpg' }]))
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(container.querySelector('[data-testid="has-many"]')?.textContent).toContain('new-id')

    // The stale (older) request resolves after — it must not overwrite the newer state.
    await act(async () => {
      oldRequest!.resolve(jsonResponse([{ id: 'old-id', filename: 'old.jpg' }]))
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(container.querySelector('[data-testid="has-many"]')?.textContent).toContain('new-id')
    expect(container.querySelector('[data-testid="has-many"]')?.textContent).not.toContain('old-id')
  })

  it('applies the result normally when requests resolve in order', async () => {
    let oldRequest: ReturnType<typeof createDeferred<Response>> | undefined
    let newRequest: ReturnType<typeof createDeferred<Response>> | undefined

    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>
    fetchMock.mockImplementation((_url: string, options: { body: string }) => {
      const deferred = createDeferred<Response>()
      if (options.body.includes('old-id')) {
        oldRequest = deferred
      } else {
        newRequest = deferred
      }
      return deferred.promise
    })

    const { container, rerender } = renderUploadInput({ value: ['old-id'] })

    await act(async () => {
      await Promise.resolve()
    })

    await act(async () => {
      oldRequest!.resolve(jsonResponse([{ id: 'old-id', filename: 'old.jpg' }]))
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(container.querySelector('[data-testid="has-many"]')?.textContent).toContain('old-id')

    rerender({ value: ['new-id'] })
    await act(async () => {
      await Promise.resolve()
    })

    await act(async () => {
      newRequest!.resolve(jsonResponse([{ id: 'new-id', filename: 'new.jpg' }]))
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(container.querySelector('[data-testid="has-many"]')?.textContent).toContain('new-id')
  })
})

function renderUploadInput({ value }: { value: (number | string)[] }): {
  container: HTMLElement
  rerender: (next: { value: (number | string)[] }) => void
} {
  const container = document.createElement('div')
  const root: Root = createRoot(container)

  const props = {
    api: '/api',
    hasMany: true,
    onChange: vi.fn(),
    path: 'upload',
    relationTo: 'uploads',
    serverURL: '',
  }

  act(() => {
    root.render(React.createElement(UploadInput, { ...props, value }))
  })

  rootCleanups.push(() => {
    act(() => {
      root.unmount()
    })
  })

  return {
    container,
    rerender: (next) => {
      act(() => {
        root.render(React.createElement(UploadInput, { ...props, value: next.value }))
      })
    },
  }
}

function jsonResponse(docs: unknown[]): Response {
  return {
    json: async () => ({ docs }),
    ok: true,
  } as unknown as Response
}

function createDeferred<Value>(): {
  promise: Promise<Value>
  resolve: (value: Value | PromiseLike<Value>) => void
} {
  let resolve: ((value: Value | PromiseLike<Value>) => void) | undefined
  const promise = new Promise<Value>((resolvePromise) => {
    resolve = resolvePromise
  })

  if (!resolve) {
    throw new Error('Expected deferred promise resolver.')
  }

  return { promise, resolve }
}
