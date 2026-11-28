// @vitest-environment jsdom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MoveDocToFolderButton } from './index.js'

const reactActEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT: boolean
}

reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = true

const toastMocks = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
}))

vi.mock('sonner', () => ({ toast: toastMocks }))

vi.mock('@faceless-ui/modal', () => ({
  useModal: () => ({ closeModal: vi.fn(), openModal: vi.fn() }),
}))

vi.mock('@payloadcms/translations', () => ({
  getTranslation: (label: unknown) => label,
}))

vi.mock('payload/shared', () => ({
  formatAdminURL: ({ path }: { path: string }) => path,
}))

vi.mock('../../../providers/Config/index.js', () => ({
  useConfig: () => ({
    config: { routes: { api: '/api' } },
    getEntityConfig: () => ({ labels: { singular: 'Post' } }),
  }),
}))

vi.mock('../../../providers/Translation/index.js', () => ({
  useTranslation: () => ({ i18n: { language: 'en' }, t: (key: string) => key }),
}))

vi.mock('../../../providers/DocumentInfo/index.js', () => ({
  useDocumentInfo: () => ({}),
}))

vi.mock('../../../forms/Form/context.js', () => ({
  useForm: () => ({}),
  useFormFields: () => null,
}))

vi.mock('../../../icons/Folder/index.js', () => ({
  FolderIcon: () => React.createElement('span'),
}))

vi.mock('../../Button/index.js', () => ({
  Button: (props: { children: React.ReactNode; onClick?: () => void }) =>
    React.createElement('button', { onClick: props.onClick }, props.children),
}))

vi.mock('../../Drawer/index.js', () => ({
  formatDrawerSlug: ({ slug }: { slug: string }) => slug,
  useDrawerDepth: () => 0,
}))

vi.mock('../Drawers/MoveToFolder/index.js', () => ({
  MoveItemsToFolderDrawer: (props: {
    onConfirm: (args: { id: number | string; name: string }) => Promise<void>
  }) =>
    React.createElement(
      'button',
      {
        onClick: () => props.onConfirm({ id: 'folder-b', name: 'Folder B' }),
      },
      'confirm-move',
    ),
}))

beforeEach(() => {
  toastMocks.error.mockClear()
  toastMocks.success.mockClear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

const renderButton = async (onConfirm: (args: { id: number | string; name: string }) => Promise<void>) => {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)

  await act(async () => {
    root.render(
      React.createElement(MoveDocToFolderButton, {
        collectionSlug: 'posts',
        docData: { id: 'doc-1', title: 'Test Post' },
        docID: 'doc-1',
        docTitle: 'Test Post',
        folderCollectionSlug: 'payload-folders',
        folderFieldName: 'folder',
        fromFolderID: 'folder-a',
        fromFolderName: 'Folder A',
        modalSlug: 'test-modal',
        onConfirm,
      }),
    )
  })

  return { container, root }
}

const clickConfirmMove = async (container: HTMLElement) => {
  const confirmButton = Array.from(container.querySelectorAll('button')).find(
    (button) => button.textContent === 'confirm-move',
  )
  expect(confirmButton).toBeDefined()

  if (!confirmButton) {
    throw new Error('confirm-move button not found')
  }

  await act(async () => {
    confirmButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

describe('MoveDocToFolderButton', () => {
  it('should show the server error and no success toast when the move is refused', async () => {
    const { container, root } = await renderButton(async () => {
      throw new Error('You are not allowed to perform this action.')
    })

    await clickConfirmMove(container)

    expect(toastMocks.success).not.toHaveBeenCalled()
    expect(toastMocks.error).toHaveBeenCalledTimes(1)
    expect(toastMocks.error).toHaveBeenCalledWith('You are not allowed to perform this action.')

    await act(async () => {
      root.unmount()
    })
    container.remove()
  })

  it('should show the success toast when the move succeeds', async () => {
    const { container, root } = await renderButton(async () => undefined)

    await clickConfirmMove(container)

    expect(toastMocks.error).not.toHaveBeenCalled()
    expect(toastMocks.success).toHaveBeenCalledTimes(1)

    await act(async () => {
      root.unmount()
    })
    container.remove()
  })

  it('should show a fallback error toast when the move rejects without an Error', async () => {
    const { container, root } = await renderButton(() => Promise.reject('refused'))

    await clickConfirmMove(container)

    expect(toastMocks.success).not.toHaveBeenCalled()
    expect(toastMocks.error).toHaveBeenCalledTimes(1)
    expect(toastMocks.error).toHaveBeenCalledWith('error:unknown')

    await act(async () => {
      root.unmount()
    })
    container.remove()
  })
})
