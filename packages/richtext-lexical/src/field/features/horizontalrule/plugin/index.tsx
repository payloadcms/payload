'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $insertNodeToNearestRoot } from '@lexical/utils'
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_EDITOR } from 'lexical'
import { useEffect } from 'react'

import {
  $createHorizontalRuleNode,
  INSERT_HORIZONTAL_RULE_COMMAND,
} from '../nodes/HorizontalRuleNode'
import './index.scss'

/**
 * Registers the INSERT_HORIZONTAL_RULE_COMMAND lexical command and defines the behavior for when it is called.
 */
export function HorizontalRulePlugin(): null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerCommand(
      INSERT_HORIZONTAL_RULE_COMMAND,
      (type) => {
        const selection = $getSelection()

        if (!$isRangeSelection(selection)) {
          return false
        }

        const focusNode = selection.focus.getNode()

        if (focusNode !== null) {
          const horizontalRuleNode = $createHorizontalRuleNode()
          $insertNodeToNearestRoot(horizontalRuleNode)
        }

        return true
      },
      COMMAND_PRIORITY_EDITOR,
    )
  }, [editor])

  return null
}
