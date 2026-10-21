import type { HistoryState } from '@lexical/react/LexicalHistoryPlugin.js'
import type { LexicalEditor } from 'lexical'

import { LexicalComposer } from '@lexical/react/LexicalComposer.js'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { ContentEditable } from '@lexical/react/LexicalContentEditable.js'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary.js'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin.js'
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin.js'
import { useLexicalEditable } from '@lexical/react/useLexicalEditable'
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  CLEAR_EDITOR_COMMAND,
  CLEAR_HISTORY_COMMAND,
  HISTORY_PUSH_TAG,
  REDO_COMMAND,
  UNDO_COMMAND,
} from 'lexical'
import { useEffect, useState } from 'react'
import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { useEditorHistory } from '../../useEditorHistory.js'
import { EditabilityPlugin } from './index.js'

type HistoryScope = Parameters<typeof useEditorHistory>[0]
type EditorState = { editor: LexicalEditor; historyState: HistoryState }
const defaultHistoryScope: HistoryScope = {
  collectionSlug: 'posts',
  id: 'document-a',
  locale: 'en',
}
const standaloneHistoryScope: HistoryScope = {}

test('should enable an editor initialized as read-only when the form becomes ready', async () => {
  const screen = await render(<EditorFixture isReadOnly />)
  const editor = screen.getByRole('textbox', { name: 'Content' })
  const originalElement = editor.element()

  await expect.element(editor).toHaveAttribute('contenteditable', 'false')
  await expect.element(editor).toHaveAttribute('aria-readonly', 'true')
  await screen.rerender(<EditorFixture isReadOnly={false} />)
  await expect.element(editor).toHaveAttribute('contenteditable', 'true')
  await expect.element(editor).not.toHaveAttribute('aria-readonly', 'true')
  expect(editor.element()).toBe(originalElement)
  await editor.fill('Ready for editing')
  await expect.element(editor).toHaveTextContent('Ready for editing')
})

test('should preserve the editor and its content while read-only changes in both directions', async () => {
  const screen = await render(<EditorFixture isReadOnly={false} />)
  const editor = screen.getByRole('textbox', { name: 'Content' })
  const originalElement = editor.element()

  await editor.fill('Unsaved document content')
  await screen.rerender(<EditorFixture isReadOnly />)
  await expect.element(editor).toHaveAttribute('contenteditable', 'false')
  await expect.element(editor).toHaveAttribute('aria-readonly', 'true')
  await expect.element(editor).toHaveTextContent('Unsaved document content')
  expect(editor.element()).toBe(originalElement)
  await screen.rerender(<EditorFixture isReadOnly={false} />)
  await expect.element(editor).toHaveAttribute('contenteditable', 'true')
  await expect.element(editor).not.toHaveAttribute('aria-readonly', 'true')
  await expect.element(editor).toHaveTextContent('Unsaved document content')
  expect(editor.element()).toBe(originalElement)
  await editor.fill('Continued document content')
  await expect.element(editor).toHaveTextContent('Continued document content')
})

test('should preserve undo and redo while preventing undo in a read-only editor', async () => {
  const onEditor = vi.fn<({ editor, historyState }: EditorState) => void>()
  const screen = await render(<EditorFixture isReadOnly={false} onEditor={onEditor} />)
  const textbox = screen.getByRole('textbox', { name: 'Content' })
  const { editor, historyState } = onEditor.mock.lastCall![0]

  replaceText({ editor, text: 'First draft' })
  await expect.element(textbox).toHaveTextContent('First draft')
  replaceText({ editor, text: 'Second draft' })
  await expect.element(textbox).toHaveTextContent('Second draft')
  expect(historyState.undoStack.length).toBeGreaterThan(0)
  await screen.rerender(<EditorFixture isReadOnly onEditor={onEditor} />)
  await expect.element(textbox).toHaveAttribute('contenteditable', 'false')
  expect(editor.isEditable()).toBe(false)
  expect(editor.dispatchCommand(UNDO_COMMAND, undefined)).toBe(false)
  await expect.element(textbox).toHaveTextContent('Second draft')
  await screen.rerender(<EditorFixture isReadOnly={false} onEditor={onEditor} />)
  await expect.element(textbox).toHaveAttribute('contenteditable', 'true')
  expect(editor.isEditable()).toBe(true)
  editor.dispatchCommand(UNDO_COMMAND, undefined)
  await expect.element(textbox).toHaveTextContent('First draft')
  editor.dispatchCommand(REDO_COMMAND, undefined)
  await expect.element(textbox).toHaveTextContent('Second draft')
  expect(onEditor.mock.lastCall![0].editor).toBe(editor)
})

for (const command of [CLEAR_HISTORY_COMMAND, CLEAR_EDITOR_COMMAND]) {
  test(`should honor ${command === CLEAR_EDITOR_COMMAND ? 'clearing the editor' : 'clearing history'} while read-only before enabling editing again`, async () => {
    const onEditor = vi.fn<({ editor, historyState }: EditorState) => void>()
    const screen = await render(<EditorFixture isReadOnly={false} onEditor={onEditor} />)
    const textbox = screen.getByRole('textbox', { name: 'Content' })
    const { editor, historyState } = onEditor.mock.lastCall![0]

    replaceText({ editor, text: 'Previous draft' })
    await expect.element(textbox).toHaveTextContent('Previous draft')
    replaceText({ editor, text: 'Current draft' })
    await expect.element(textbox).toHaveTextContent('Current draft')
    expect(historyState.undoStack.length).toBeGreaterThan(0)
    await screen.rerender(<EditorFixture isReadOnly onEditor={onEditor} />)
    await expect.element(textbox).toHaveAttribute('contenteditable', 'false')
    expect(editor.dispatchCommand(command, undefined)).toBe(command === CLEAR_HISTORY_COMMAND)
    const expectedContent = 'Current draft'

    await expect.element(textbox).toHaveTextContent(expectedContent)
    expect(historyState.undoStack).toEqual([])
    expect(historyState.redoStack).toEqual([])
    await screen.rerender(<EditorFixture isReadOnly={false} onEditor={onEditor} />)
    await expect.element(textbox).toHaveAttribute('contenteditable', 'true')
    editor.dispatchCommand(UNDO_COMMAND, undefined)
    await expect.element(textbox).toHaveTextContent(expectedContent)
    editor.dispatchCommand(REDO_COMMAND, undefined)
    await expect.element(textbox).toHaveTextContent(expectedContent)
  })
}

for (const { name, firstScope, nextScope } of [
  {
    name: 'document',
    firstScope: defaultHistoryScope,
    nextScope: { ...defaultHistoryScope, id: 'document-b' },
  },
  {
    name: 'typed document ID',
    firstScope: { ...defaultHistoryScope, id: 1 },
    nextScope: { ...defaultHistoryScope, id: '1' },
  },
  {
    name: 'collection',
    firstScope: defaultHistoryScope,
    nextScope: { ...defaultHistoryScope, collectionSlug: 'pages' },
  },
  {
    name: 'global',
    firstScope: { globalSlug: 'header' },
    nextScope: { globalSlug: 'footer' },
  },
  {
    name: 'locale',
    firstScope: defaultHistoryScope,
    nextScope: { ...defaultHistoryScope, locale: 'fr' },
  },
]) {
  test(`should reset history when the ${name} changes even if editor content is identical`, async () => {
    const onEditor = vi.fn<({ editor, historyState }: EditorState) => void>()
    const screen = await render(
      <EditorFixture historyScope={firstScope} isReadOnly={false} onEditor={onEditor} />,
    )
    const textbox = screen.getByRole('textbox', { name: 'Content' })
    const { editor, historyState } = onEditor.mock.lastCall![0]

    replaceText({ editor, text: 'Only the previous document should know this' })
    await expect.element(textbox).toHaveTextContent('Only the previous document should know this')
    replaceText({ editor, text: 'Identical document content' })
    await expect.element(textbox).toHaveTextContent('Identical document content')
    expect(historyState.undoStack.length).toBeGreaterThan(0)
    await screen.rerender(
      <EditorFixture historyScope={nextScope} isReadOnly={false} onEditor={onEditor} />,
    )
    expect(onEditor.mock.lastCall![0].editor).toBe(editor)
    expect(onEditor.mock.lastCall![0].historyState).not.toBe(historyState)
    editor.dispatchCommand(UNDO_COMMAND, undefined)
    await expect.element(textbox).toHaveTextContent('Identical document content')
  })
}

function EditorFixture({
  historyScope = standaloneHistoryScope,
  isReadOnly,
  onEditor,
}: {
  historyScope?: HistoryScope
  isReadOnly: boolean
  onEditor?: (state: EditorState) => void
}) {
  const [initialConfig] = useState(() => ({
    editable: !isReadOnly,
    namespace: 'editability-regression',
    onError: (error: Error) => {
      throw error
    },
  }))

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <EditabilityPlugin isReadOnly={isReadOnly} />
      <HistoryFixture historyScope={historyScope} onEditor={onEditor} />
      <PlainTextPlugin
        contentEditable={<ContentEditable aria-label="Content" />}
        ErrorBoundary={LexicalErrorBoundary}
      />
    </LexicalComposer>
  )
}

function HistoryFixture({
  historyScope,
  onEditor,
}: {
  historyScope: HistoryScope
  onEditor?: (state: EditorState) => void
}) {
  const [editor] = useLexicalComposerContext()
  const isEditable = useLexicalEditable()
  const historyState = useEditorHistory(historyScope)

  useEffect(() => {
    onEditor?.({ editor, historyState })
  }, [editor, historyState, onEditor])

  return isEditable ? <HistoryPlugin externalHistoryState={historyState} /> : null
}

function replaceText({ editor, text }: { editor: LexicalEditor; text: string }) {
  editor.update(
    () => {
      $getRoot()
        .clear()
        .append($createParagraphNode().append($createTextNode(text)))
    },
    { discrete: true, tag: HISTORY_PUSH_TAG },
  )
}
