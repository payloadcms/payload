'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { $findMatchingParent, $insertNodeToNearestRoot } from '@lexical/utils'
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_EDITOR,
} from 'lexical'
import { useEffect } from 'react'

import type { PluginComponent } from '../../../typesClient.js'

import { INSERT_HORIZONTAL_RULE_COMMAND } from '../../server/nodes/HorizontalRuleNode.js'
import { $createHorizontalRuleNode, $isHorizontalRuleNode } from '../nodes/HorizontalRuleNode.js'
import './index.css'

const HR_SELECTED_CLASS = 'LexicalEditorTheme__hrSelected'

/**
 * Registers the INSERT_HORIZONTAL_RULE_COMMAND lexical command and defines the behavior for when it is called.
 */
export const HorizontalRulePlugin: PluginComponent<undefined> = () => {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    const unregisterCommand = editor.registerCommand(
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

    const unregisterUpdateListener = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot()
        const children = root.getChildren()
        const selection = $getSelection()

        // Collect all HR nodes and their elements
        const hrEntries: Array<{ element: HTMLElement; index: number }> = []
        for (let i = 0; i < children.length; i++) {
          const child = children[i]
          if ($isHorizontalRuleNode(child)) {
            const element = editor.getElementByKey(child.getKey())
            if (element) {
              hrEntries.push({ element, index: i })
            }
          }
        }

        if (hrEntries.length === 0) {
          return
        }

        if (!$isRangeSelection(selection) || selection.isCollapsed()) {
          // Remove range-selection highlighting from all HRs
          for (const { element } of hrEntries) {
            element.classList.remove(HR_SELECTED_CLASS)
          }
          return
        }

        const anchorNode = selection.anchor.getNode()
        const focusNode = selection.focus.getNode()

        const anchorTopLevel =
          $findMatchingParent(anchorNode, (n) => $isRootOrShadowRoot(n.getParent())) || anchorNode
        const focusTopLevel =
          $findMatchingParent(focusNode, (n) => $isRootOrShadowRoot(n.getParent())) || focusNode

        const anchorIdx = children.indexOf(anchorTopLevel)
        const focusIdx = children.indexOf(focusTopLevel)

        if (anchorIdx === -1 || focusIdx === -1) {
          return
        }

        const startIdx = Math.min(anchorIdx, focusIdx)
        const endIdx = Math.max(anchorIdx, focusIdx)

        for (const { element, index } of hrEntries) {
          if (index >= startIdx && index <= endIdx) {
            element.classList.add(HR_SELECTED_CLASS)
          } else {
            element.classList.remove(HR_SELECTED_CLASS)
          }
        }
      })
    })

    return () => {
      unregisterCommand()
      unregisterUpdateListener()
    }
  }, [editor])

  return null
}
