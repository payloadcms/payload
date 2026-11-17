import { useLayoutEffect } from 'react'
import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import type { HierarchyContents } from 'payload'

import type { SelectionDocument } from '../../../providers/DocumentSelection/types.js'

import {
  DocumentSelectionProvider,
  useDocumentSelection,
} from '../../../providers/DocumentSelection/index.js'
import { ContentsSelectAll } from './ContentsSelectAll/index.js'
import { ContentsSelectRow } from './ContentsSelectRow/index.js'
import { useHierarchyContentsSelectionScope } from './useHierarchyContentsSelectionScope.js'

vi.mock('../../../providers/Translation/index.js', () => ({
  useTranslation: () => ({
    t: (key: string, args?: { label?: string }) => (args ? `Select ${args.label}` : key),
  }),
}))

vi.mock('../../../fields/Checkbox/Input.js', () => ({
  CheckboxInput: (props: {
    'aria-label': string
    checked: boolean
    onToggle: () => void
    partialChecked?: boolean
    readOnly?: boolean
  }) => (
    <input
      aria-label={props['aria-label']}
      checked={props.checked}
      disabled={props.readOnly}
      onChange={props.onToggle}
      type="checkbox"
    />
  ),
}))

const documents: SelectionDocument[] = [
  { collectionSlug: 'pages', document: { id: 1 }, metadata: { allowedCollections: ['articles'] } },
  { collectionSlug: 'pages', document: { id: 2 }, metadata: { allowedCollections: ['assets'] } },
  { collectionSlug: 'articles', document: { id: 1 } },
]
const collapsed = [documents[0], documents[2]]
const data = {}
const initialContents: HierarchyContents = { parentID: null, sources: [] }

function Controls({ visible }: { visible: SelectionDocument[] }) {
  const { getTotalCount, registerVisibleDocuments } = useDocumentSelection()

  useLayoutEffect(() => {
    registerVisibleDocuments?.({ documents: visible })
  }, [registerVisibleDocuments, visible])

  return (
    <>
      <output aria-label="Selected count">{getTotalCount()}</output>
      <ContentsSelectAll documents={visible} />
      {visible.map(({ collectionSlug, document }) => (
        <ContentsSelectRow
          collectionSlug={collectionSlug}
          id={document.id}
          key={`${collectionSlug}:${document.id}`}
          title={`${collectionSlug}:${document.id}`}
        />
      ))}
    </>
  )
}

function Fixture({
  visible = documents,
  contents = initialContents,
}: {
  contents?: HierarchyContents
  visible?: SelectionDocument[]
}) {
  const selectionScopeKey = useHierarchyContentsSelectionScope({
    collectionSlug: 'pages',
    contents,
    isEnabled: true,
    parentID: contents.parentID,
  })
  return (
    <DocumentSelectionProvider
      collectionData={data}
      currentUserId="0"
      selectionScopeKey={selectionScopeKey}
    >
      <Controls visible={visible} />
    </DocumentSelectionProvider>
  )
}

test('should select remaining collections without deselecting a fully selected visible collection', async () => {
  const screen = await render(<Fixture visible={collapsed} />)

  await screen.getByRole('checkbox', { name: 'Select pages:1' }).click()
  await screen.getByRole('checkbox', { name: 'general:selectAllRows' }).click()
  await expect.element(screen.getByRole('checkbox', { name: 'Select pages:1' })).toBeChecked()
  await expect.element(screen.getByRole('checkbox', { name: 'Select articles:1' })).toBeChecked()
  await expect
    .element(screen.getByRole('status', { name: 'Selected count' }))
    .toHaveTextContent('2')
  await screen.getByRole('checkbox', { name: 'general:deselectAllRows' }).click()
  await expect
    .element(screen.getByRole('status', { name: 'Selected count' }))
    .toHaveTextContent('0')
})

test('should preserve hidden explicit selections while the view-wide checkbox changes visible rows', async () => {
  const screen = await render(<Fixture />)

  await screen.getByRole('checkbox', { name: 'Select pages:2' }).click()
  await screen.rerender(<Fixture visible={collapsed} />)
  await screen.getByRole('checkbox', { name: 'general:selectAllRows' }).click()
  await expect
    .element(screen.getByRole('status', { name: 'Selected count' }))
    .toHaveTextContent('3')
  await screen.getByRole('checkbox', { name: 'general:deselectAllRows' }).click()
  await expect
    .element(screen.getByRole('status', { name: 'Selected count' }))
    .toHaveTextContent('1')
})

test('should disable another user’s locked row and include the current editor in select-all', async () => {
  const visible: SelectionDocument[] = [
    {
      collectionSlug: 'pages',
      document: { id: 1, _isLocked: true, _userEditing: { id: 'other' } },
    },
    { collectionSlug: 'pages', document: { id: 2, _isLocked: true, _userEditing: { id: '0' } } },
  ]
  const screen = await render(<Fixture visible={visible} />)

  await expect.element(screen.getByRole('checkbox', { name: 'Select pages:1' })).toBeDisabled()
  await screen.getByRole('checkbox', { name: 'general:selectAllRows' }).click()
  await expect.element(screen.getByRole('checkbox', { name: 'Select pages:2' })).toBeChecked()
  await expect
    .element(screen.getByRole('status', { name: 'Selected count' }))
    .toHaveTextContent('1')
})

test('should retain selection for local visibility changes and clear it for a new authoritative snapshot', async () => {
  const screen = await render(<Fixture />)

  await screen.getByRole('checkbox', { name: 'Select pages:1' }).click()
  await screen.rerender(<Fixture visible={collapsed} />)
  await expect
    .element(screen.getByRole('status', { name: 'Selected count' }))
    .toHaveTextContent('1')
  await screen.rerender(<Fixture contents={{ ...initialContents }} visible={collapsed} />)
  await expect
    .element(screen.getByRole('status', { name: 'Selected count' }))
    .toHaveTextContent('0')
})
