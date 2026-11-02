import type { OnMount } from '@monaco-editor/react'

import { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import { beforeAll, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-react'

import type { Props } from './types.js'

import CodeEditor from './CodeEditor.js'

vi.mock('../../providers/Theme/index.js', () => ({
  useTheme: () => ({ theme: 'light' }),
}))

beforeAll(async () => {
  self.MonacoEnvironment = {
    getWorker: () =>
      new Worker(new URL('monaco-editor/editor/editor.worker.js', import.meta.url), {
        type: 'module',
      }),
  }
  loader.config({ monaco })
  await loader.init()
}, 60000)

test('should expose native read-only state when the mounted editor receives focus', async () => {
  const { editor, screen } = await renderEditor({ readOnly: true })
  const input = screen.getByRole('textbox', { name: 'Source' })

  await expect.element(input).toHaveProperty('readOnly', true)
  editor.focus()
  await expect.element(input).toHaveFocus()
  await userEvent.keyboard('changed')
  expect(editor.getValue()).toBe('const enabled = true;')
})

test('should restore editing after toggling read-only with default options', async () => {
  const { editor, screen } = await renderEditor()
  const editContextOption = monaco.editor.EditorOption.editContext
  const initialEditContext = editor.getOption(editContextOption)

  await screen.rerender(<CodeEditor {...editorProps} readOnly />)
  await expect.poll(() => editor.getDomNode()?.querySelector('textarea')?.readOnly).toBe(true)
  expect(editor.getOption(editContextOption)).toBe(false)

  await screen.rerender(<CodeEditor {...editorProps} readOnly={false} />)
  await expect.poll(() => editor.getOption(editContextOption)).toBe(initialEditContext)
  expect(editor.getOption(monaco.editor.EditorOption.domReadOnly)).toBe(false)
  editor.setPosition({ column: 22, lineNumber: 1 })
  editor.focus()
  await userEvent.keyboard('changed')
  expect(editor.getValue()).toBe('const enabled = true;changed')
})

test('should retain native read-only state when caller options and value change', async () => {
  const { editor, screen } = await renderEditor({ readOnly: true })

  await screen.rerender(
    <CodeEditor
      {...editorProps}
      options={{ ariaLabel: 'Updated source', domReadOnly: false, editContext: true }}
      readOnly
      value="const enabled = false;"
    />,
  )

  await expect
    .element(screen.getByRole('textbox', { name: 'Updated source' }))
    .toHaveProperty('readOnly', true)
  editor.focus()
  await userEvent.keyboard('changed')
  expect(editor.getValue()).toBe('const enabled = false;')
})

test('should use the latest caller options when editing is re-enabled', async () => {
  const { editor, screen } = await renderEditor({
    options: { ariaLabel: 'Source', domReadOnly: false, editContext: true },
    readOnly: true,
  })

  await screen.rerender(
    <CodeEditor
      {...editorProps}
      options={{ ariaLabel: 'Source', domReadOnly: true, editContext: false }}
      readOnly={false}
    />,
  )

  await expect.poll(() => editor.getOption(monaco.editor.EditorOption.readOnly)).toBe(false)
  expect(editor.getOption(monaco.editor.EditorOption.domReadOnly)).toBe(true)
  expect(editor.getOption(monaco.editor.EditorOption.editContext)).toBe(false)
})

test.each([false, true])(
  'should preserve imperative onMount options across rerenders and read-only toggles when initially readOnly=%s',
  async (initialReadOnly) => {
    const { editor, screen } = await renderEditor({
      onMount: (editor) => editor.updateOptions({ editContext: false }),
      readOnly: initialReadOnly,
    })
    const editContextOption = monaco.editor.EditorOption.editContext
    const afterMount = editor.getOption(editContextOption)

    await screen.rerender(
      <CodeEditor
        {...editorProps}
        options={{ ariaLabel: 'Updated source' }}
        readOnly={initialReadOnly}
      />,
    )
    const afterRerender = editor.getOption(editContextOption)

    await screen.rerender(<CodeEditor {...editorProps} readOnly />)
    await expect.poll(() => editor.getDomNode()?.querySelector('textarea')?.readOnly).toBe(true)
    const whileReadOnly = editor.getOption(editContextOption)

    await screen.rerender(<CodeEditor {...editorProps} readOnly={false} />)
    await expect.poll(() => editor.getOption(monaco.editor.EditorOption.readOnly)).toBe(false)
    const afterReenablingEditing = editor.getOption(editContextOption)

    editor.setPosition({ column: 22, lineNumber: 1 })
    editor.focus()
    await userEvent.keyboard('changed')
    expect(editor.getValue()).toBe('const enabled = true;changed')
    expect({ afterMount, afterReenablingEditing, afterRerender, whileReadOnly }).toEqual({
      afterMount: false,
      afterReenablingEditing: false,
      afterRerender: false,
      whileReadOnly: false,
    })
  },
)

test('should preserve focus when read-only caller options are reapplied', async () => {
  const options = { ariaLabel: 'Source', domReadOnly: false, editContext: true }
  const { editor, screen } = await renderEditor({ options, readOnly: true })

  editor.focus()
  await expect.poll(() => editor.hasTextFocus()).toBe(true)
  await screen.rerender(
    <CodeEditor {...editorProps} options={{ ...options, ariaLabel: 'Updated source' }} readOnly />,
  )

  await expect.element(screen.getByRole('textbox', { name: 'Updated source' })).toHaveFocus()
})

test('should restore options changed imperatively after mounting', async () => {
  const { editor, screen } = await renderEditor()

  editor.updateOptions({ domReadOnly: true, editContext: false })
  await screen.rerender(<CodeEditor {...editorProps} readOnly />)
  await expect.poll(() => editor.getDomNode()?.querySelector('textarea')?.readOnly).toBe(true)
  await screen.rerender(<CodeEditor {...editorProps} readOnly={false} />)
  await expect.poll(() => editor.getOption(monaco.editor.EditorOption.readOnly)).toBe(false)

  expect(editor.getOption(monaco.editor.EditorOption.domReadOnly)).toBe(true)
  expect(editor.getOption(monaco.editor.EditorOption.editContext)).toBe(false)
  editor.setPosition({ column: 22, lineNumber: 1 })
  editor.focus()
  await userEvent.keyboard('changed')
  expect(editor.getValue()).toBe('const enabled = true;changed')
})

test('should allow selecting and copying read-only editor contents', async () => {
  const mounted = Promise.withResolvers<Parameters<OnMount>[0]>()
  const screen = await render(
    <>
      <CodeEditor {...editorProps} onMount={(editor) => mounted.resolve(editor)} readOnly />
      <textarea aria-label="Copy destination" />
    </>,
  )
  const editor = await mounted.promise

  editor.setSelection({
    endColumn: 22,
    endLineNumber: 1,
    startColumn: 1,
    startLineNumber: 1,
  })
  editor.focus()
  await userEvent.copy()
  await screen.getByRole('textbox', { name: 'Copy destination' }).click()
  await userEvent.paste()

  await expect
    .element(screen.getByRole('textbox', { name: 'Copy destination' }))
    .toHaveValue('const enabled = true;')
  expect(editor.getValue()).toBe('const enabled = true;')
})

test('should keep nested editor clipboard events inside the editor after toggling read-only', async () => {
  const clipboardEvents: string[] = []
  const renderNestedEditor = ({ readOnly }: { readOnly: boolean }) => (
    <div
      contentEditable
      onCopy={() => clipboardEvents.push('copy')}
      onCut={() => clipboardEvents.push('cut')}
      onPaste={() => clipboardEvents.push('paste')}
      suppressContentEditableWarning
    >
      <div contentEditable={false}>
        <CodeEditor
          {...editorProps}
          onMount={onMount}
          options={{ ariaLabel: 'Source', editContext: true }}
          readOnly={readOnly}
        />
      </div>
    </div>
  )
  const mounted = Promise.withResolvers<Parameters<OnMount>[0]>()
  const onMount: OnMount = (editor) => mounted.resolve(editor)
  const screen = await render(renderNestedEditor({ readOnly: true }))
  const editor = await mounted.promise

  await screen.rerender(renderNestedEditor({ readOnly: false }))
  await expect.poll(() => editor.getOption(monaco.editor.EditorOption.readOnly)).toBe(false)
  expect(editor.getOption(monaco.editor.EditorOption.editContext)).toBe(false)

  await screen.rerender(renderNestedEditor({ readOnly: false }))
  expect(editor.getOption(monaco.editor.EditorOption.editContext)).toBe(false)
  editor.setPosition({ column: 22, lineNumber: 1 })
  editor.focus()
  await userEvent.keyboard('changed')
  expect(editor.getValue()).toBe('const enabled = true;changed')

  const input = editor.getDomNode()?.querySelector('textarea')

  expect(input).not.toBeNull()
  for (const type of ['copy', 'cut', 'paste']) {
    input!.dispatchEvent(new ClipboardEvent(type, { bubbles: true, cancelable: true }))
  }
  expect(clipboardEvents).toEqual([])
})

const editorProps: Props = {
  defaultLanguage: 'plaintext',
  options: { ariaLabel: 'Source' },
  value: 'const enabled = true;',
}

async function renderEditor({ onMount, ...props }: Props = {}) {
  const mounted = Promise.withResolvers<Parameters<OnMount>[0]>()
  const screen = await render(
    <CodeEditor
      {...editorProps}
      {...props}
      onMount={(editor, monaco) => {
        onMount?.(editor, monaco)
        mounted.resolve(editor)
      }}
    />,
  )
  const editor = await mounted.promise

  return { editor, screen }
}
