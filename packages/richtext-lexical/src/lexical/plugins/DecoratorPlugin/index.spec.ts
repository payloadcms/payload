// @vitest-environment jsdom

import type { LexicalEditor } from 'lexical'
import type { Root } from 'react-dom/client'

import {
  createLexicalComposerContext,
  LexicalComposerContext,
} from '@lexical/react/LexicalComposerContext'
import {
  $createNodeSelection,
  $createParagraphNode,
  $getRoot,
  $setSelection,
  createEditor,
} from 'lexical'
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  $createHorizontalRuleServerNode,
  HorizontalRuleServerNode,
} from '../../../features/horizontalRule/server/nodes/HorizontalRuleNode.js'
import { DecoratorPlugin } from './index.js'

describe('DecoratorPlugin', () => {
  let container: HTMLDivElement
  let editor: LexicalEditor
  let root: Root
  let rootElement: HTMLDivElement
  const nestedEditors: LexicalEditor[] = []
  const nestedRoots: Root[] = []

  beforeEach(async () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    container = document.createElement('div')
    rootElement = document.createElement('div')
    document.body.append(container, rootElement)
    editor = createEditor({
      namespace: 'decorator-selection-test',
      nodes: [HorizontalRuleServerNode],
      onError: (error) => {
        throw error
      },
    })
    editor.setRootElement(rootElement)
    root = createRoot(container)

    await act(() => {
      root.render(
        createElement(
          LexicalComposerContext.Provider,
          { value: [editor, createLexicalComposerContext(null, undefined)] },
          createElement(DecoratorPlugin),
        ),
      )
    })
  })

  afterEach(async () => {
    await act(() => {
      root.unmount()
      nestedRoots.splice(0).forEach((nestedRoot) => nestedRoot.unmount())
    })
    nestedEditors.splice(0).forEach((nestedEditor) => nestedEditor.setRootElement(null))
    editor.setRootElement(null)
    container.remove()
    rootElement.remove()
    vi.unstubAllGlobals()
  })

  it('should highlight a decorator inserted and selected in the same update', () => {
    editor.update(
      () => {
        const node = $createHorizontalRuleServerNode()
        const selection = $createNodeSelection()

        $getRoot().append(node)
        selection.add(node.getKey())
        $setSelection(selection)
      },
      { discrete: true },
    )

    expect(rootElement.querySelector('hr')?.classList.contains('decorator-selected')).toBe(true)
  })

  it('should remove the highlight when the decorator selection is cleared', () => {
    editor.update(
      () => {
        const node = $createHorizontalRuleServerNode()
        const selection = $createNodeSelection()

        $getRoot().append(node)
        selection.add(node.getKey())
        $setSelection(selection)
      },
      { discrete: true },
    )
    editor.update(() => $setSelection(null), { discrete: true })

    expect(rootElement.querySelector('hr')?.classList.contains('decorator-selected')).toBe(false)
  })

  it('should clear the parent highlight when a nested editor changes selection', async () => {
    editor.update(
      () => {
        const node = $createHorizontalRuleServerNode()
        const selection = $createNodeSelection()

        $getRoot().append(node)
        selection.add(node.getKey())
        $setSelection(selection)
      },
      { discrete: true },
    )

    const nestedEditor = createEditor({ parentEditor: editor })
    const nestedRoot = document.createElement('div')
    const nestedContainer = document.createElement('div')
    const nestedReactRoot = createRoot(nestedContainer)

    nestedEditors.push(nestedEditor)
    nestedRoots.push(nestedReactRoot)
    container.append(nestedRoot, nestedContainer)
    nestedEditor.setRootElement(nestedRoot)
    await act(() => {
      nestedReactRoot.render(
        createElement(
          LexicalComposerContext.Provider,
          { value: [nestedEditor, createLexicalComposerContext(null, undefined)] },
          createElement(DecoratorPlugin),
        ),
      )
    })
    nestedEditor.update(
      () => {
        const paragraph = $createParagraphNode()
        const selection = $createNodeSelection()

        $getRoot().append(paragraph)
        selection.add(paragraph.getKey())
        $setSelection(selection)
      },
      { discrete: true },
    )

    expect(rootElement.querySelector('hr')?.classList.contains('decorator-selected')).toBe(false)
  })
})
