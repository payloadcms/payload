'use client'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $insertNodeToNearestRoot, mergeRegister } from '@lexical/utils'
import {
  $getPreviousSelection,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  type LexicalCommand,
  createCommand,
} from 'lexical'
import { useConfig } from 'payload/components/utilities'
import React, { useEffect } from 'react'

import type { RawUploadPayload } from '../nodes/UploadNode'

import { UploadDrawer } from '../drawer'
import { $createUploadNode, UploadNode } from '../nodes/UploadNode'

export type InsertUploadPayload = Readonly<RawUploadPayload>

export const INSERT_UPLOAD_COMMAND: LexicalCommand<InsertUploadPayload> =
  createCommand('INSERT_UPLOAD_COMMAND')

export function UploadPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext()
  const { collections } = useConfig()

  useEffect(() => {
    if (!editor.hasNodes([UploadNode])) {
      throw new Error('UploadPlugin: UploadNode not registered on editor')
    }

    return mergeRegister(
      editor.registerCommand<InsertUploadPayload>(
        INSERT_UPLOAD_COMMAND,
        (payload: InsertUploadPayload) => {
          editor.update(() => {
            const uploadNode = $createUploadNode({
              data: {
                fields: payload.fields,
                relationTo: payload.relationTo,
                value: {
                  id: payload.id,
                },
              },
            })

            const selection = $getSelection() || $getPreviousSelection()

            if ($isRangeSelection(selection)) {
              const { focus } = selection
              const focusNode = focus.getNode()

              // First, delete currently selected node if it's an empty paragraph
              if ($isParagraphNode(focusNode) && focusNode.getTextContentSize() === 0) {
                focusNode.remove()
              }

              $insertNodeToNearestRoot(uploadNode)
            }
          })

          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    )
  }, [editor])

  return <UploadDrawer enabledCollectionSlugs={collections.map(({ slug }) => slug)} />
}
