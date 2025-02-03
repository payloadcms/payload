'use client'

import type { DecoratorNode } from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { mergeRegister } from '@lexical/utils'
import {
  $createNodeSelection,
  $getNearestNodeFromDOMNode,
  $getSelection,
  $isDecoratorNode,
  $isNodeSelection,
  $setSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
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
          const decorator = $getDecorator(event)
          if (!decorator) {
            return true
          }
          const { decoratorElement, decoratorNode } = decorator
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
            const selection = $createNodeSelection()
            selection.add(decoratorNode.getKey())
            $setSelection(selection)
            decoratorElement.classList.add('decorator-selected')
          }
          return true
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(KEY_DELETE_COMMAND, $onDelete, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_BACKSPACE_COMMAND, $onDelete, COMMAND_PRIORITY_LOW),
    )
  }, [editor])

  return null
}

function $getDecorator(
  event: MouseEvent,
): { decoratorElement: Element; decoratorNode: DecoratorNode<unknown> } | undefined {
  if (!(event.target instanceof Element)) {
    return undefined
  }
  const decoratorElement = event.target.closest('[data-lexical-decorator="true"]')
  if (!decoratorElement) {
    return undefined
  }
  const node = $getNearestNodeFromDOMNode(decoratorElement)
  return $isDecoratorNode(node) ? { decoratorElement, decoratorNode: node } : undefined
}
