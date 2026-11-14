// @vitest-environment jsdom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const reactActEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT: boolean
}

reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = true

let capturedOnConfirm: (args: { id: number | string; name: string }) => Promise<void>

vi.mock('payload/shared', () => ({
  formatAdminURL: ({ path }: { path: string }) => path,
}))

vi.mock('../../../exports/client/index.js', () => ({
  MoveDocToFolderButton: (props: {
    fromFolderName: string
    onConfirm: (args: { id: number | string; name: string }) => Promise<void>
  }) => {
    capturedOnConfirm = props.onConfirm
    return React.createElement('span', null, props.fromFolderName)
  },
  useConfig: () => ({ config: { routes: { api: '/api' } } }),
  useTranslation: () => ({ t: (key: string) => key }),
}))

const fetchMock = vi.fn()

const flush = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  fetchMock.mockReset()
})

const renderCell = async () => {
  // The initial folder-name lookup (GET) resolves to Folder A
  fetchMock.mockImplementation(async (url: string, options?: RequestInit) => {
    if (options?.method === 'GET') {
      return { json: async () => ({ name: 'Folder A' }), ok: true }
    }
    return { json: async () => ({}), ok: true }
  })

  const { FolderTableCellClient: Cell } = await import('./index.client.js')

  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)

  await act(async () => {
    root.render(
      React.createElement(Cell, {
        collectionSlug: 'posts',
        data: { folder: 'folder-a', id: 'doc-1' },
        docTitle: 'Test Post',
        folderCollectionSlug: 'payload-folders',
        folderFieldName: 'folder',
      }),
    )
  })
  await flush()

  return { container, root }
}

const confirmMove = async () => {
  let thrown: unknown
  await act(async () => {
    try {
      await capturedOnConfirm({ id: 'folder-b', name: 'Folder B' })
    } catch (err) {
      thrown = err
    }
  })
  return thrown
}

describe('FolderTableCellClient onConfirm', () => {
  it('should reject with the server error and keep the old folder when the PATCH is refused', async () => {
    const { container, root } = await renderCell()
    expect(container.textContent).toBe('Folder A')

    fetchMock.mockImplementation(async (url: string, options?: RequestInit) => {
      if (options?.method === 'GET') {
        return { json: async () => ({ name: 'Folder A' }), ok: true }
      }
      return {
        json: async () => ({
          errors: [{ message: 'You are not allowed to perform this action.' }],
        }),
        ok: false,
        status: 403,
      }
    })

    const thrown = await confirmMove()

    expect(thrown).toBeInstanceOf(Error)
    expect((thrown as Error).message).toBe('You are not allowed to perform this action.')

    // The cell must still show the old folder: nothing was saved
    expect(container.textContent).toBe('Folder A')

    await act(async () => {
      root.unmount()
    })
    container.remove()
  })

  it('should update the cell when the PATCH succeeds', async () => {
    const { container, root } = await renderCell()

    const thrown = await confirmMove()

    expect(thrown).toBeUndefined()
    expect(container.textContent).toBe('Folder B')

    await act(async () => {
      root.unmount()
    })
    container.remove()
  })

  it('should reject with a fallback message when the refused PATCH has no error body', async () => {
    const { container, root } = await renderCell()

    fetchMock.mockImplementation(async (url: string, options?: RequestInit) => {
      if (options?.method === 'GET') {
        return { json: async () => ({ name: 'Folder A' }), ok: true }
      }
      return {
        json: async () => {
          throw new Error('Unexpected token')
        },
        ok: false,
        status: 500,
      }
    })

    const thrown = await confirmMove()

    expect(thrown).toBeInstanceOf(Error)
    expect((thrown as Error).message).toBe('error:unknown')
    expect(container.textContent).toBe('Folder A')

    await act(async () => {
      root.unmount()
    })
    container.remove()
  })
})
