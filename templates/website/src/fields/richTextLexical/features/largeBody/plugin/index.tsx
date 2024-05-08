'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { $insertNodeToNearestRoot } from '@lexical/utils'
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_EDITOR } from 'lexical'
import { useEffect } from 'react'

import { $createLargeBodyNode, INSERT_LARGE_BODY_COMMAND } from '../nodes/LargeBodyNode'
import './index.scss'

/**
 * Registers the INSERT_LARGE_BODY_COMMAND lexical command and defines the behavior for when it is called.
 */
export function LargeBodyPlugin(): null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerCommand(
      INSERT_LARGE_BODY_COMMAND,
      (type) => {
        const selection = $getSelection()

        if (!$isRangeSelection(selection)) {
          return false
        }

        const focusNode = selection.focus.getNode()

        if (focusNode !== null) {
          const largeBodyNode = $createLargeBodyNode()
          $insertNodeToNearestRoot(largeBodyNode)
        }

        return true
      },
      COMMAND_PRIORITY_EDITOR,
    )
  }, [editor])

  return null
}
