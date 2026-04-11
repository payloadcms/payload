'use client'

import type { DecoratorNode, ElementNode, LexicalNode } from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $findMatchingParent, mergeRegister } from '@lexical/utils'
import {
  $createNodeSelection,
  $getEditor,
  $getNearestNodeFromDOMNode,
  $getSelection,
  $isDecoratorNode,
  $isElementNode,
  $isLineBreakNode,
  $isNodeSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  $isTextNode,
  $setSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
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
          const decorator = $getSelectedDecorator()
          document.querySelector('.decorator-selected')?.classList.remove('decorator-selected')
          if (decorator) {
            decorator.element?.classList.add('decorator-selected')
            return true
          }
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_ARROW_UP_COMMAND,
        (event) => {
          // CASE 1: Node selection
          const selection = $getSelection()
          if ($isNodeSelection(selection)) {
            const prevSibling = selection.getNodes()[0]?.getPreviousSibling()
            if ($isDecoratorNode(prevSibling)) {
              const element = $getEditor().getElementByKey(prevSibling.getKey())
              if (element) {
                $selectDecorator({ element, node: prevSibling })
                event.preventDefault()
                return true
              }
              return false
            }
            if (!$isElementNode(prevSibling)) {
              return false
            }
            const lastDescendant = prevSibling.getLastDescendant() ?? prevSibling
            if (!lastDescendant) {
              return false
            }
            const block = $findMatchingParent(lastDescendant, INTERNAL_$isBlock)
            block?.selectStart()
            event.preventDefault()
            return true
          }
          if (!$isRangeSelection(selection)) {
            return false
          }

          // CASE 2: Range selection
          // Get first selected block
          const firstPoint = selection.isBackward() ? selection.anchor : selection.focus
          const firstNode = firstPoint.getNode()
          const firstSelectedBlock = $findMatchingParent(firstNode, (node) => {
            return findFirstSiblingBlock(node) !== null
          })
          const prevBlock = firstSelectedBlock?.getPreviousSibling()
          if (!firstSelectedBlock || prevBlock !== findFirstSiblingBlock(firstSelectedBlock)) {
            return false
          }

          if ($isDecoratorNode(prevBlock)) {
            const prevBlockElement = $getEditor().getElementByKey(prevBlock.getKey())
            if (prevBlockElement) {
              $selectDecorator({ element: prevBlockElement, node: prevBlock })
              event.preventDefault()
              return true
            }
          }

          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_ARROW_DOWN_COMMAND,
        (event) => {
          // CASE 1: Node selection
          const selection = $getSelection()
          if ($isNodeSelection(selection)) {
            event.preventDefault()
            const nextSibling = selection.getNodes()[0]?.getNextSibling()
            if ($isDecoratorNode(nextSibling)) {
              const element = $getEditor().getElementByKey(nextSibling.getKey())
              if (element) {
                $selectDecorator({ element, node: nextSibling })
              }
              return true
            }
            if (!$isElementNode(nextSibling)) {
              return true
            }
            const firstDescendant = nextSibling.getFirstDescendant() ?? nextSibling
            if (!firstDescendant) {
              return true
            }
            const block = $findMatchingParent(firstDescendant, INTERNAL_$isBlock)
            block?.selectEnd()
            event.preventDefault()
            return true
          }
          if (!$isRangeSelection(selection)) {
            return false
          }

          // CASE 2: Range selection
          // Get last selected block
          const lastPoint = selection.isBackward() ? selection.anchor : selection.focus
          const lastNode = lastPoint.getNode()
          const lastSelectedBlock = $findMatchingParent(lastNode, (node) => {
            return findLaterSiblingBlock(node) !== null
          })
          const nextBlock = lastSelectedBlock?.getNextSibling()
          if (!lastSelectedBlock || nextBlock !== findLaterSiblingBlock(lastSelectedBlock)) {
            return false
          }

          if ($isDecoratorNode(nextBlock)) {
            const nextBlockElement = $getEditor().getElementByKey(nextBlock.getKey())
            if (nextBlockElement) {
              $selectDecorator({ element: nextBlockElement, node: nextBlock })
              event.preventDefault()
              return true
            }
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
): { element: HTMLElement; node: DecoratorNode<unknown> } | undefined {
  if (!(event.target instanceof HTMLElement)) {
    return undefined
  }
  const element = event.target.closest('[data-lexical-decorator="true"]')
  if (!(element instanceof HTMLElement)) {
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
        decorator: node,
        element: $getEditor().getElementByKey(node.getKey()),
      }
    : undefined
}

function $selectDecorator({
  element,
  node,
}: {
  element: HTMLElement
  node: DecoratorNode<unknown>
}) {
  document.querySelector('.decorator-selected')?.classList.remove('decorator-selected')
  const selection = $createNodeSelection()
  selection.add(node.getKey())
  $setSelection(selection)
  element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  element.classList.add('decorator-selected')
}

/**
 * Copied from https://github.com/facebook/lexical/blob/main/packages/lexical/src/LexicalUtils.ts
 *
 * This function returns true for a DecoratorNode that is not inline OR
 * an ElementNode that is:
 * - not a root or shadow root
 * - not inline
 * - can't be empty
 * - has no children or an inline first child
 */
export function INTERNAL_$isBlock(node: LexicalNode): node is DecoratorNode<unknown> | ElementNode {
  if ($isDecoratorNode(node) && !node.isInline()) {
    return true
  }
  if (!$isElementNode(node) || $isRootOrShadowRoot(node)) {
    return false
  }

  const firstChild = node.getFirstChild()
  const isLeafElement =
    firstChild === null ||
    $isLineBreakNode(firstChild) ||
    $isTextNode(firstChild) ||
    firstChild.isInline()

  return !node.isInline() && node.canBeEmpty() !== false && isLeafElement
}

function findLaterSiblingBlock(node: LexicalNode): LexicalNode | null {
  let current = node.getNextSibling()
  while (current !== null) {
    if (INTERNAL_$isBlock(current)) {
      return current
    }
    current = current.getNextSibling()
  }
  return null
}

function findFirstSiblingBlock(node: LexicalNode): LexicalNode | null {
  let current = node.getPreviousSibling()
  while (current !== null) {
    if (INTERNAL_$isBlock(current)) {
      return current
    }
    current = current.getPreviousSibling()
  }
  return null
}
