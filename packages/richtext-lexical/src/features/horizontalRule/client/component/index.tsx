'use client'

import type { NodeKey } from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection.js'
import { addClassNamesToElement, mergeRegister, removeClassNamesFromElement } from '@lexical/utils'
import {
  $getSelection,
  $isNodeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
} from 'lexical'
import { useCallback, useEffect } from 'react'

import { $isHorizontalRuleNode } from '../nodes/HorizontalRuleNode.js'

const isSelectedClassName = 'selected'

/**
 * React component rendered in the lexical editor, WITHIN the hr element created by createDOM of the HorizontalRuleNode.
 *
 * @param nodeKey every node has a unique key (this key is not saved to the database and thus may differ between sessions). It's useful for working with the CURRENT lexical editor state
 */
export function HorizontalRuleComponent({ nodeKey }: { nodeKey: NodeKey }) {
  const [editor] = useLexicalComposerContext()
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey)

  const $onDelete = useCallback(
    (event: KeyboardEvent) => {
      const deleteSelection = $getSelection()
      if (isSelected && $isNodeSelection(deleteSelection)) {
        event.preventDefault()
        editor.update(() => {
          deleteSelection.getNodes().forEach((node) => {
            if ($isHorizontalRuleNode(node)) {
              node.remove()
            }
          })
        })
      }
      return false
    },
    [editor, isSelected],
  )

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        CLICK_COMMAND,
        (event: MouseEvent) => {
          const hrElem = editor.getElementByKey(nodeKey)

          if (event.target === hrElem) {
            if (!event.shiftKey) {
              clearSelection()
            }
            setSelected(!isSelected)
            return true
          }

          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(KEY_DELETE_COMMAND, $onDelete, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_BACKSPACE_COMMAND, $onDelete, COMMAND_PRIORITY_LOW),
    )
  }, [clearSelection, editor, isSelected, nodeKey, $onDelete, setSelected])

  useEffect(() => {
    const hrElem = editor.getElementByKey(nodeKey)
    if (hrElem !== null) {
      if (isSelected) {
        addClassNamesToElement(hrElem, isSelectedClassName)
      } else {
        removeClassNamesFromElement(hrElem, isSelectedClassName)
      }
    }
  }, [editor, isSelected, nodeKey])

  return null
}
