import { useLayoutEffect } from 'react'
import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import type { CollectionData, DocumentSelectionContextValue, SelectionDocument } from './types.js'

import { DocumentSelectionProvider, useDocumentSelection } from './index.js'

vi.mock('../Selection/index.js', () => ({
  SelectAllStatus: { AllInPage: 'allInPage', None: 'none', Some: 'some' },
}))

const data: CollectionData = { pages: { docs: [{ id: 1 }, { id: 2 }] } }
const visible: SelectionDocument[] = data.pages.docs.map((document) => ({
  collectionSlug: 'pages',
  document,
}))
const collapsed: SelectionDocument[] = []
const secondOnly = [visible[1]]

function Consumer({
  documents,
  onRegister,
  onSelection,
  shouldRegister = true,
}: {
  documents: SelectionDocument[]
  onRegister?: () => void
  onSelection?: (value: DocumentSelectionContextValue) => void
  shouldRegister?: boolean
}) {
  const selection = useDocumentSelection()
  const { registerVisibleDocuments } = selection

  useLayoutEffect(() => {
    if (shouldRegister) {
      registerVisibleDocuments?.({ documents })
    }
    onRegister?.()
  }, [documents, onRegister, registerVisibleDocuments, shouldRegister])

  useLayoutEffect(() => {
    onSelection?.(selection)
  }, [onSelection, selection])

  return (
    <>
      <output aria-label="Count">{selection.getTotalCount()}</output>
      <output aria-label="Visible status">
        {selection.getSelectAllStatus({ collectionSlug: 'pages' })}
      </output>
      <output aria-label="Incremental">{String(Boolean(registerVisibleDocuments))}</output>
      <button
        onClick={() => selection.toggleAllInCollection({ collectionSlug: 'pages' })}
        type="button"
      >
        Toggle visible
      </button>
      <button
        onClick={() => selection.toggleSelection({ id: 1, collectionSlug: 'pages' })}
        type="button"
      >
        Toggle first
      </button>
      <button
        onClick={() => selection.toggleSelection({ id: 999, collectionSlug: 'pages' })}
        type="button"
      >
        Toggle unknown
      </button>
    </>
  )
}

function Fixture({
  collectionData = data,
  currentUserId,
  documents = visible,
  onRegister,
  onSelection,
  scope,
  shouldRegister,
}: {
  collectionData?: CollectionData
  currentUserId?: string
  documents?: SelectionDocument[]
  onRegister?: () => void
  onSelection?: (value: DocumentSelectionContextValue) => void
  scope?: string
  shouldRegister?: boolean
}) {
  return (
    <DocumentSelectionProvider
      collectionData={collectionData}
      currentUserId={currentUserId}
      selectionScopeKey={scope}
    >
      <Consumer
        documents={documents}
        onRegister={onRegister}
        onSelection={onSelection}
        shouldRegister={shouldRegister}
      />
    </DocumentSelectionProvider>
  )
}

test('should keep legacy selection and page-change reset behavior without an opt-in scope', async () => {
  const screen = await render(<Fixture />)

  await expect
    .element(screen.getByRole('status', { name: 'Incremental' }))
    .toHaveTextContent('false')
  await screen.getByRole('button', { name: 'Toggle visible' }).click()
  await expect.element(screen.getByRole('status', { name: 'Count' })).toHaveTextContent('2')
  await screen.rerender(<Fixture collectionData={{ pages: { docs: [{ id: 3 }] } }} />)
  await expect.element(screen.getByRole('status', { name: 'Count' })).toHaveTextContent('0')
})

test('should preserve hidden selections and toggle only visible documents', async () => {
  const screen = await render(<Fixture scope="pages:root" />)

  await screen.getByRole('button', { name: 'Toggle first' }).click()
  await screen.rerender(<Fixture documents={secondOnly} scope="pages:root" />)
  await expect
    .element(screen.getByRole('status', { name: 'Visible status' }))
    .toHaveTextContent('none')
  await screen.getByRole('button', { name: 'Toggle visible' }).click()
  await expect.element(screen.getByRole('status', { name: 'Count' })).toHaveTextContent('2')
  await expect
    .element(screen.getByRole('status', { name: 'Visible status' }))
    .toHaveTextContent('allInPage')
  await screen.getByRole('button', { name: 'Toggle visible' }).click()
  await expect.element(screen.getByRole('status', { name: 'Count' })).toHaveTextContent('1')
  await screen.rerender(<Fixture documents={collapsed} scope="pages:root" />)
  await expect.element(screen.getByRole('status', { name: 'Count' })).toHaveTextContent('1')
})

test('should clear incremental selections when the navigation scope changes', async () => {
  const screen = await render(<Fixture scope="pages:root" />)

  await screen.getByRole('button', { name: 'Toggle first' }).click()
  await screen.rerender(<Fixture scope="pages:folder-1" />)
  await expect.element(screen.getByRole('status', { name: 'Count' })).toHaveTextContent('0')
})

test('should keep registration stable while selecting and reject unknown documents', async () => {
  const onRegister = vi.fn()
  const screen = await render(<Fixture onRegister={onRegister} scope="pages:root" />)

  await screen.getByRole('button', { name: 'Toggle unknown' }).click()
  await expect.element(screen.getByRole('status', { name: 'Count' })).toHaveTextContent('0')
  await screen.getByRole('button', { name: 'Toggle first' }).click()
  await expect.element(screen.getByRole('status', { name: 'Count' })).toHaveTextContent('1')
  expect(onRegister).toHaveBeenCalledTimes(1)
})

test('should ignore callbacks captured before navigating to another selection scope', async () => {
  const capture = vi.fn<(value: DocumentSelectionContextValue) => void>()
  const screen = await render(<Fixture onSelection={capture} scope="pages:A" />)
  const stale = capture.mock.calls.at(-1)![0]

  await screen.rerender(<Fixture documents={secondOnly} onSelection={capture} scope="pages:B" />)
  await screen.getByRole('button', { name: 'Toggle visible' }).click()
  stale.registerVisibleDocuments?.({ documents: visible })
  stale.toggleSelection({ id: 1, collectionSlug: 'pages' })
  stale.toggleAllInCollection({ collectionSlug: 'pages' })
  stale.clearCollection({ collectionSlug: 'pages' })
  stale.clearAll()
  await screen.rerender(<Fixture documents={secondOnly} onSelection={capture} scope="pages:B" />)

  await expect.element(screen.getByRole('status', { name: 'Count' })).toHaveTextContent('1')
  await expect
    .element(screen.getByRole('status', { name: 'Visible status' }))
    .toHaveTextContent('allInPage')
  expect(capture.mock.calls.at(-1)![0].getSelectionsForActions().pages.ids).toEqual([2])
})

test('should not resurrect selections when returning to a scope without registering intervening rows', async () => {
  const screen = await render(<Fixture scope="pages:A" />)

  await screen.getByRole('button', { name: 'Toggle first' }).click()
  await screen.rerender(<Fixture scope="pages:B" shouldRegister={false} />)
  await screen.rerender(<Fixture scope="pages:A" shouldRegister={false} />)

  await expect.element(screen.getByRole('status', { name: 'Count' })).toHaveTextContent('0')
})

test('should reject old editor callbacks after authenticated user identity changes', async () => {
  const documents: SelectionDocument[] = [
    {
      collectionSlug: 'pages',
      document: { id: 1, _isLocked: true, _userEditing: { id: 'editor-A' } },
    },
  ]
  const capture = vi.fn<(value: DocumentSelectionContextValue) => void>()
  const screen = await render(
    <Fixture
      currentUserId="editor-A"
      documents={documents}
      onSelection={capture}
      scope="pages:A"
    />,
  )
  const stale = capture.mock.calls.at(-1)![0]

  await screen.getByRole('button', { name: 'Toggle first' }).click()
  await screen.rerender(
    <Fixture
      currentUserId="editor-B"
      documents={documents}
      onSelection={capture}
      scope="pages:A"
    />,
  )
  stale.toggleSelection({ id: 1, collectionSlug: 'pages' })
  await screen.rerender(
    <Fixture
      currentUserId="editor-B"
      documents={documents}
      onSelection={capture}
      scope="pages:A"
    />,
  )

  await expect.element(screen.getByRole('status', { name: 'Count' })).toHaveTextContent('0')
  expect(capture.mock.calls.at(-1)![0].isLocked({ id: 1, collectionSlug: 'pages' })).toBe(true)
})
