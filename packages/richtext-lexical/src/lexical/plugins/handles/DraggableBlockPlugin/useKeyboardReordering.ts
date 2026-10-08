import type { LexicalEditor } from 'lexical'

import { mergeRegister } from '@lexical/utils'
import {
  $getSelection,
  $isNodeSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_DOWN_COMMAND,
} from 'lexical'
import { useEffect } from 'react'

import { $moveBlock } from './moveBlock.js'

/** Move the current top-level line, including decorator nodes, without a pointer. */
export function useKeyboardReordering({
  editor,
  instructionsID,
}: {
  editor: LexicalEditor
  instructionsID: string
}) {
  useEffect(() => {
    const moveLine = ({ direction, event }: { direction: -1 | 1; event: KeyboardEvent }) => {
      if (
        !editor.isEditable() ||
        !event.altKey ||
        !event.shiftKey ||
        event.ctrlKey ||
        event.metaKey
      ) {
        return false
      }
      const selection = $getSelection()
      const selectedNode =
        $isRangeSelection(selection) && selection.isCollapsed()
          ? selection.anchor.getNode()
          : $isNodeSelection(selection) && selection.getNodes().length === 1
            ? selection.getNodes()[0]
            : null
      const node = selectedNode?.getTopLevelElement()

      if (!node) {
        return false
      }
      event.preventDefault()
      $moveBlock({ direction, node })
      return true
    }

    return mergeRegister(
      editor.registerCommand(
        KEY_DOWN_COMMAND,
        (event) =>
          event.target instanceof HTMLElement &&
          Boolean(event.target.closest('.draggable-block-menu')),
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        KEY_ARROW_UP_COMMAND,
        (event) => moveLine({ direction: -1, event }),
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        KEY_ARROW_DOWN_COMMAND,
        (event) => moveLine({ direction: 1, event }),
        COMMAND_PRIORITY_HIGH,
      ),
    )
  }, [editor])

  useEffect(() => {
    let restore: (() => void) | undefined
    const unregister = editor.registerRootListener((root) => {
      restore?.()
      if (!root) {
        return
      }
      const description = root.getAttribute('aria-describedby')
      root.setAttribute('aria-describedby', [description, instructionsID].filter(Boolean).join(' '))
      restore = () => {
        if (description === null) {
          root.removeAttribute('aria-describedby')
        } else {
          root.setAttribute('aria-describedby', description)
        }
      }
    })

    return () => {
      unregister()
      restore?.()
    }
  }, [editor, instructionsID])
}
