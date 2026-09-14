import type { LexicalEditor, SerializedEditorState } from 'lexical'

import { createHeadlessEditor } from '@lexical/headless'
import { $createParagraphNode, $createTextNode, $getRoot } from 'lexical'
import { describe, expect, it } from 'vitest'

import { registerEnsureRootNotEmpty } from './registerEnsureRootNotEmpty.js'

const createEditor = (): LexicalEditor =>
  createHeadlessEditor({
    nodes: [],
    onError: (error) => {
      throw error
    },
  })

/** Seeds one paragraph with text, then removes it - what deleting the only node does. */
const removeOnlyNode = (editor: LexicalEditor): SerializedEditorState => {
  editor.update(
    () => {
      $getRoot().append($createParagraphNode().append($createTextNode('only node')))
    },
    { discrete: true },
  )
  editor.update(
    () => {
      $getRoot().getFirstChildOrThrow().remove()
    },
    { discrete: true },
  )
  return editor.getEditorState().toJSON()
}

const load = (state: SerializedEditorState): void => {
  const editor = createEditor()
  editor.setEditorState(editor.parseEditorState(state))
}

describe('registerEnsureRootNotEmpty', () => {
  it('documents the problem: without it, removing the only node saves a state that cannot be loaded', () => {
    const state = removeOnlyNode(createEditor())

    expect(state.root.children).toHaveLength(0)
    expect(() => load(state)).toThrow(/editor state is empty/)
  })

  it('re-seeds an empty paragraph when an update removes the last root-level node', () => {
    const editor = createEditor()
    registerEnsureRootNotEmpty(editor)

    const state = removeOnlyNode(editor)

    expect(state.root.children).toHaveLength(1)
    expect(state.root.children[0]).toMatchObject({ children: [], type: 'paragraph' })
    expect(() => load(state)).not.toThrow()
  })

  it('leaves a root that still has children alone', () => {
    const editor = createEditor()
    registerEnsureRootNotEmpty(editor)

    editor.update(
      () => {
        const root = $getRoot()
        root.append($createParagraphNode().append($createTextNode('first')))
        root.append($createParagraphNode().append($createTextNode('second')))
      },
      { discrete: true },
    )
    editor.update(
      () => {
        $getRoot().getFirstChildOrThrow().remove()
      },
      { discrete: true },
    )

    const state = editor.getEditorState().toJSON()
    expect(state.root.children).toHaveLength(1)
    expect(state.root.children[0]).toMatchObject({
      children: [{ text: 'second', type: 'text' }],
      type: 'paragraph',
    })
  })

  it('does not interfere with an update that empties and refills the root', () => {
    const editor = createEditor()
    registerEnsureRootNotEmpty(editor)

    editor.update(
      () => {
        const root = $getRoot()
        root.append($createParagraphNode().append($createTextNode('before')))
      },
      { discrete: true },
    )
    editor.update(
      () => {
        const root = $getRoot()
        root.clear()
        root.append($createParagraphNode().append($createTextNode('after')))
      },
      { discrete: true },
    )

    const state = editor.getEditorState().toJSON()
    expect(state.root.children).toHaveLength(1)
    expect(state.root.children[0]).toMatchObject({
      children: [{ text: 'after', type: 'text' }],
      type: 'paragraph',
    })
  })

  it('stops when unregistered', () => {
    const editor = createEditor()
    const unregister = registerEnsureRootNotEmpty(editor)
    unregister()

    expect(removeOnlyNode(editor).root.children).toHaveLength(0)
  })
})
