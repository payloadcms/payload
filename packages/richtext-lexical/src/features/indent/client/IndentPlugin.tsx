import type { ElementNode } from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin'
import { $findMatchingParent, mergeRegister } from '@lexical/utils'
import {
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  INDENT_CONTENT_COMMAND,
  KEY_TAB_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  TabNode,
} from 'lexical'
import { useEffect } from 'react'

import type { PluginComponent } from '../../typesClient.js'
import type { IndentFeatureProps } from '../server/index.js'

export const IndentPlugin: PluginComponent<IndentFeatureProps> = ({ clientProps }) => {
  const [editor] = useLexicalComposerContext()
  const { disabledNodes, disableTabNode } = clientProps

  useEffect(() => {
    if (!editor || !disabledNodes?.length) {
      return
    }
    return editor.registerCommand(
      INDENT_CONTENT_COMMAND,
      () => {
        return $handleIndentAndOutdent((block) => {
          if (!disabledNodes.includes(block.getType())) {
            const indent = block.getIndent()
            block.setIndent(indent + 1)
          }
        })
      },
      COMMAND_PRIORITY_LOW,
    )
  }, [editor, disabledNodes])

  useEffect(() => {
    if (!editor || !disableTabNode) {
      return
    }
    return mergeRegister(
      // This is so that when you press Tab in the middle of a paragraph,
      // it indents the paragraph, instead of inserting a TabNode.
      editor.registerCommand<KeyboardEvent>(
        KEY_TAB_COMMAND,
        (event) => {
          event.preventDefault()
          return editor.dispatchCommand(
            event.shiftKey ? OUTDENT_CONTENT_COMMAND : INDENT_CONTENT_COMMAND,
            undefined,
          )
        },
        COMMAND_PRIORITY_LOW,
      ),
      // Tab isn't the only way to insert a TabNode. We have to make sure
      // it doesn't happen, for example, when pasting from the clipboard.
      editor.registerNodeTransform(TabNode, (node) => {
        node.remove()
      }),
    )
  }, [editor, disableTabNode])

  return <TabIndentationPlugin />
}

function $handleIndentAndOutdent(indentOrOutdent: (block: ElementNode) => void): boolean {
  const selection = $getSelection()
  if (!$isRangeSelection(selection)) {
    return false
  }
  const alreadyHandled = new Set()
  const nodes = selection.getNodes()
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]!
    const key = node.getKey()
    if (alreadyHandled.has(key)) {
      continue
    }
    const parentBlock = $findMatchingParent(
      node,
      (parentNode): parentNode is ElementNode =>
        $isElementNode(parentNode) && !parentNode.isInline(),
    )
    if (parentBlock === null) {
      continue
    }
    const parentKey = parentBlock.getKey()
    if (parentBlock.canIndent() && !alreadyHandled.has(parentKey)) {
      alreadyHandled.add(parentKey)
      indentOrOutdent(parentBlock)
    }
  }
  return alreadyHandled.size > 0
}
