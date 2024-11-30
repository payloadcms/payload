'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { mergeRegister } from '@lexical/utils'

import './index.scss'

import {
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  type ElementNode,
} from 'lexical'
import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'

import type { PluginComponentWithAnchor } from '../../../../typesClient.js'
import type {
  CreateWrapperBlockNodeFn,
  IsWrapperBlockNodeFn,
  WrapperBlockFields,
  WrapperBlockNodeType,
} from '../../../WrapperBlockNode.js'

import { INSERT_WRAPPER_BLOCK_COMMAND } from '../commands.js'
import { BlockEditor } from './BlockEditor/index.js'

export type AdditionalWrapperBlocksPluginArgs = {
  $createWrapperBlockNode: CreateWrapperBlockNodeFn
  $isWrapperBlockNode: IsWrapperBlockNodeFn
}

export const WrapperBlocksPlugin: PluginComponentWithAnchor<
  any,
  AdditionalWrapperBlocksPluginArgs
> = (props) => {
  const { $createWrapperBlockNode, $isWrapperBlockNode, anchorElem = document.body } = props

  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        INSERT_WRAPPER_BLOCK_COMMAND,
        (fields) => {
          const selection = $getSelection()

          if (!$isRangeSelection(selection)) {
            return false
          }
          const nodes = $isRangeSelection(selection) ? selection.extract() : []

          let prevParent: ElementNode | null | WrapperBlockNodeType = null
          let wrapperBlockNode: null | WrapperBlockNodeType = null

          if (fields === null) {
            // Remove Wrapper Blocks
            nodes?.forEach((node) => {
              const parent = node.getParent()

              if ($isWrapperBlockNode(parent)) {
                const children = parent.getChildren()

                for (let i = 0; i < children.length; i += 1) {
                  parent.insertBefore(children[i])
                }

                parent.remove()
              }
            })
            return true
          }

          nodes?.forEach((node) => {
            const parent = node.getParent()

            if (
              parent === wrapperBlockNode ||
              parent === null ||
              ($isElementNode(node) && !node.isInline())
            ) {
              return
            }

            if (!parent.is(prevParent)) {
              prevParent = parent
              wrapperBlockNode = $createWrapperBlockNode(fields as WrapperBlockFields)

              if ($isWrapperBlockNode(parent)) {
                if (node.getPreviousSibling() === null) {
                  parent.insertBefore(wrapperBlockNode)
                } else {
                  parent.insertAfter(wrapperBlockNode)
                }
              } else {
                node.insertBefore(wrapperBlockNode)
              }
            }

            if ($isWrapperBlockNode(node)) {
              if (node.is(wrapperBlockNode)) {
                return
              }
              if (wrapperBlockNode !== null) {
                const children = node.getChildren()

                for (let i = 0; i < children.length; i += 1) {
                  wrapperBlockNode.append(children[i])
                }
              }

              node.remove()
              return
            }

            if (wrapperBlockNode !== null) {
              wrapperBlockNode.append(node)
            }
          })

          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    )
  }, [$createWrapperBlockNode, $isWrapperBlockNode, editor])

  return createPortal(
    <BlockEditor
      $createWrapperBlockNode={$createWrapperBlockNode}
      $isWrapperBlockNode={$isWrapperBlockNode}
      anchorElem={anchorElem}
    />,
    anchorElem,
  )
}
