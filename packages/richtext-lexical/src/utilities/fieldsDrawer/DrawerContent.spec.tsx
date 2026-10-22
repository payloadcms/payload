import type { FormState } from 'payload'

import { act } from 'react'
import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { DrawerContent } from './DrawerContent.js'

const mocks = vi.hoisted(() => ({
  getDocPreferences: vi.fn(async () => undefined),
  getFormState: vi.fn(),
  parentDocumentFields: {} as FormState,
}))

vi.mock('@lexical/react/useLexicalEditable', () => ({ useLexicalEditable: () => true }))
vi.mock('@payloadcms/ui', () => ({
  Form: ({ initialState }: { initialState: FormState }) => (
    <output aria-label="Drawer initial state">{JSON.stringify(initialState)}</output>
  ),
  RenderFields: () => null,
  useDocumentForm: () => ({ fields: mocks.parentDocumentFields }),
  useDocumentInfo: () => ({ collectionSlug: 'posts', getDocPreferences: mocks.getDocPreferences }),
  useServerFunctions: () => ({ getFormState: mocks.getFormState }),
}))
vi.mock('@payloadcms/ui/shared', () => ({
  abortAndIgnore: (controller: AbortController) => controller.abort(),
}))
vi.mock('../../lexical/config/client/EditorConfigProvider.js', () => ({
  useEditorConfigContext: () => ({ fieldProps: { featureClientSchemaMap: {} } }),
}))
vi.mock('./useDrawerSubmit.js', () => ({ RegisterFormSubmit: () => null }))

test('should preserve the latest drawer state when an aborted request completes afterward', async () => {
  const requests: {
    resolve: (value: { state: FormState | null }) => void
    signal: AbortSignal
  }[] = []
  mocks.getFormState.mockImplementation(
    ({ signal }: { signal: AbortSignal }) =>
      new Promise<{ state: FormState | null }>((resolve) => requests.push({ resolve, signal })),
  )
  const props = {
    drawerSlug: 'link',
    featureKey: 'link',
    handleDrawerSubmit: vi.fn(),
    schemaPath: 'posts.richText',
    submitRef: { current: null },
  }
  const screen = await render(<DrawerContent {...props} />)

  await vi.waitFor(() => expect(requests).toHaveLength(1))
  mocks.parentDocumentFields = { richText: { value: 'updated parent' } }
  await screen.rerender(<DrawerContent {...props} />)
  await vi.waitFor(() => expect(requests).toHaveLength(2))
  expect(requests[0]!.signal.aborted).toBe(true)
  const latestState = { newTab: { value: true } }

  requests[1]!.resolve({ state: latestState })
  await expect.element(screen.getByRole('status')).toHaveTextContent(JSON.stringify(latestState))
  await act(async () => {
    requests[0]!.resolve({ state: null })
  })
  await expect.element(screen.getByRole('status')).toHaveTextContent(JSON.stringify(latestState))
})
