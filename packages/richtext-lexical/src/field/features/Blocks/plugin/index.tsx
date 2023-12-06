'use client'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $insertNodeToNearestRoot, mergeRegister } from '@lexical/utils'
import { COMMAND_PRIORITY_EDITOR } from 'lexical'
import React, { useEffect } from 'react'

import type { BlockFields } from '../nodes/BlocksNode'

import { BlocksDrawerComponent } from '../drawer'
import { $createBlockNode, BlockNode } from '../nodes/BlocksNode'
import { INSERT_BLOCK_COMMAND } from './commands'

export type InsertBlockPayload = Exclude<BlockFields, 'id'>

export function BlocksPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (!editor.hasNodes([BlockNode])) {
      throw new Error('BlocksPlugin: BlocksNode not registered on editor')
    }

    return mergeRegister(
      editor.registerCommand<InsertBlockPayload>(
        INSERT_BLOCK_COMMAND,
        (payload: InsertBlockPayload) => {
          editor.update(() => {
            const blockNode = $createBlockNode(payload)

            $insertNodeToNearestRoot(blockNode)
          })

          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    )
  }, [editor])

  return <BlocksDrawerComponent />
}
