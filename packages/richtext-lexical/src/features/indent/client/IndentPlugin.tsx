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
} from 'lexical'
import { useEffect } from 'react'

import type { PluginComponent } from '../../typesClient.js'
import type { IndentFeatureProps } from '../server/index.js'

export const IndentPlugin: PluginComponent<IndentFeatureProps> = (props) => {
  const [editor] = useLexicalComposerContext()
  const { disabledNodes } = props.clientProps

  useEffect(() => {
    if (!editor || !disabledNodes?.length) {
      return
    }
    return mergeRegister(
      editor.registerCommand(
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
      ),
    )
  }, [editor, disabledNodes])

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
