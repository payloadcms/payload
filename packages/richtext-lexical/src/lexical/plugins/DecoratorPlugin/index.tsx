'use client'

import type { DecoratorNode } from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { mergeRegister } from '@lexical/utils'
import {
  $createNodeSelection,
  $getEditor,
  $getNearestNodeFromDOMNode,
  $getSelection,
  $isDecoratorNode,
  $isNodeSelection,
  $setSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from 'lexical'
import { useEffect } from 'react'

import './index.scss'

// TODO: This should ideally be fixed in Lexical. See
// https://github.com/facebook/lexical/pull/7072
export function DecoratorPlugin() {
  const [editor] = useLexicalComposerContext()

  const $onDelete = (event: KeyboardEvent) => {
    const selection = $getSelection()
    if (!$isNodeSelection(selection)) {
      return false
    }
    event.preventDefault()
    selection.getNodes().forEach((node) => {
      node.remove()
    })
    return true
  }

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        CLICK_COMMAND,
        (event) => {
          document.querySelector('.decorator-selected')?.classList.remove('decorator-selected')
          const decorator = $getDecoratorByMouseEvent(event)
          if (!decorator) {
            return true
          }
          const { target } = event
          const isInteractive =
            !(target instanceof HTMLElement) ||
            target.isContentEditable ||
            target.closest(
              'button, textarea, input, .react-select, .code-editor, .no-select-decorator, [role="button"]',
            )
          if (isInteractive) {
            $setSelection(null)
          } else {
            $selectDecorator(decorator)
          }
          return true
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(KEY_DELETE_COMMAND, $onDelete, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_BACKSPACE_COMMAND, $onDelete, COMMAND_PRIORITY_LOW),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          const decoratorNode = $getSelectedDecorator()
          document.querySelector('.decorator-selected')?.classList.remove('decorator-selected')
          if (decoratorNode) {
            decoratorNode.element.classList.add('decorator-selected')
            return true
          }
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
    )
  }, [editor])

  return null
}

function $getDecoratorByMouseEvent(
  event: MouseEvent,
): { element: Element; node: DecoratorNode<unknown> } | undefined {
  if (!(event.target instanceof Element)) {
    return undefined
  }
  const element = event.target.closest('[data-lexical-decorator="true"]')
  if (!element) {
    return undefined
  }
  const node = $getNearestNodeFromDOMNode(element)
  return $isDecoratorNode(node) ? { element, node } : undefined
}

function $getSelectedDecorator() {
  const selection = $getSelection()
  if (!$isNodeSelection(selection)) {
    return undefined
  }
  const nodes = selection.getNodes()
  if (nodes.length !== 1) {
    return undefined
  }
  const node = nodes[0]
  return $isDecoratorNode(node)
    ? {
        decoratorElement: $getEditor().getElementByKey(node.getKey()),
        decoratorNode: node,
      }
    : undefined
}

function $selectDecorator({ element, node }: { element: Element; node: DecoratorNode<unknown> }) {
  const selection = $createNodeSelection()
  selection.add(node.getKey())
  $setSelection(selection)
  element.classList.add('decorator-selected')
}
