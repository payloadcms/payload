'use client'
import lexicalComposerContextImport from '@lexical/react/LexicalComposerContext.js'
const { useLexicalComposerContext } = lexicalComposerContextImport
import lexicalUtilsImport from '@lexical/utils'
const { $insertNodeToNearestRoot, mergeRegister } = lexicalUtilsImport
import lexicalImport from 'lexical'
const {
  $getPreviousSelection,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
} = lexicalImport

import type { LexicalCommand } from 'lexical'

import { useConfig } from '@payloadcms/ui/providers/Config'
import React, { useEffect } from 'react'

import type { UploadData } from '../nodes/UploadNode.js'

import { UploadDrawer } from '../drawer/index.js'
import { $createUploadNode, UploadNode } from '../nodes/UploadNode.js'

export type InsertUploadPayload = Readonly<UploadData>

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
                value: payload.value,
              },
            })

            const selection = $getSelection() || $getPreviousSelection()

            if ($isRangeSelection(selection)) {
              const { focus } = selection
              const focusNode = focus.getNode()

              // First, delete currently selected node if it's an empty paragraph and if there are sufficient
              // paragraph nodes (more than 1) left in the parent node, so that we don't "trap" the user
              if (
                $isParagraphNode(focusNode) &&
                focusNode.getTextContentSize() === 0 &&
                focusNode
                  .getParent()
                  .getChildren()
                  .filter((node) => $isParagraphNode(node)).length > 1
              ) {
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
