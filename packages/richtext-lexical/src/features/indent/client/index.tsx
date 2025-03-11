'use client'

import type { ElementNode, LexicalNode } from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin'
import { $findMatchingParent, mergeRegister } from '@lexical/utils'
import {
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
} from 'lexical'
import { useEffect } from 'react'

import type { ToolbarGroup } from '../../toolbars/types.js'
import type { PluginComponent } from '../../typesClient.js'
import type { IndentFeatureProps } from '../server/index.js'

import { IndentDecreaseIcon } from '../../../lexical/ui/icons/IndentDecrease/index.js'
import { IndentIncreaseIcon } from '../../../lexical/ui/icons/IndentIncrease/index.js'
import { createClientFeature } from '../../../utilities/createClientFeature.js'
import { toolbarIndentGroupWithItems } from './toolbarIndentGroup.js'

const toolbarGroups: ToolbarGroup[] = [
  toolbarIndentGroupWithItems([
    {
      ChildComponent: IndentDecreaseIcon,
      isActive: () => false,
      isEnabled: ({ selection }) => {
        const nodes = selection?.getNodes()
        if (!nodes?.length) {
          return false
        }
        let atLeastOneNodeCanOutdent = false
        const isIndentable = (node: LexicalNode): node is ElementNode =>
          $isElementNode(node) && node.canIndent()
        for (const node of nodes) {
          if (isIndentable(node)) {
            if (node.getIndent() <= 0) {
              return false
            } else {
              atLeastOneNodeCanOutdent = true
            }
          }
        }
        if (!atLeastOneNodeCanOutdent && $isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode()
          if (
            $findMatchingParent(anchorNode, (node) => isIndentable(node) && node.getIndent() > 0)
          ) {
            return true
          }
          const focusNode = selection.focus.getNode()
          if (
            $findMatchingParent(focusNode, (node) => isIndentable(node) && node.getIndent() > 0)
          ) {
            return true
          }
        }
        return atLeastOneNodeCanOutdent
      },
      key: 'indentDecrease',
      label: ({ i18n }) => {
        return i18n.t('lexical:indent:decreaseLabel')
      },
      onSelect: ({ editor }) => {
        editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)
      },
      order: 1,
    },
    {
      ChildComponent: IndentIncreaseIcon,
      isActive: () => false,
      key: 'indentIncrease',
      label: ({ i18n }) => {
        return i18n.t('lexical:indent:increaseLabel')
      },
      onSelect: ({ editor }) => {
        editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)
      },
      order: 2,
    },
  ]),
]

const IndentPlugin: PluginComponent<IndentFeatureProps> = (props) => {
  const [editor] = useLexicalComposerContext()
  const { disabledNodes } = props.clientProps

  useEffect(() => {
    if (!editor) {
      return
    }
    return mergeRegister(
      editor.registerCommand(
        INDENT_CONTENT_COMMAND,
        () => {
          return $handleIndentAndOutdent((block) => {
            if (!disabledNodes || !disabledNodes.includes(block.getType())) {
              const indent = block.getIndent()
              block.setIndent(indent + 1)
            }
          })
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        OUTDENT_CONTENT_COMMAND,
        () => {
          return $handleIndentAndOutdent((block) => {
            const indent = block.getIndent()
            if (indent > 0) {
              block.setIndent(indent - 1)
            }
          })
        },
        COMMAND_PRIORITY_LOW,
      ),
    )
  }, [editor, disabledNodes])

  return <TabIndentationPlugin />
}

export const IndentFeatureClient = createClientFeature({
  plugins: [
    {
      Component: IndentPlugin,
      position: 'normal',
    },
  ],
  toolbarFixed: {
    groups: toolbarGroups,
  },
  toolbarInline: {
    groups: toolbarGroups,
  },
})

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
