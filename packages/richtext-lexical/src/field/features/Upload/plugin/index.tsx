import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $wrapNodeInElement, mergeRegister } from '@lexical/utils'
import {
  $createParagraphNode,
  $insertNodes,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_EDITOR,
  type LexicalCommand,
  createCommand,
} from 'lexical'
import { useConfig } from 'payload/components/utilities'
import React, { useEffect } from 'react'

import type { RawUploadPayload } from '../nodes/UploadNode'

import { $createUploadNode, UploadNode } from '../nodes/UploadNode'
import { UploadDrawer } from './drawer'

export type InsertUploadPayload = Readonly<RawUploadPayload>

export const INSERT_UPLOAD_COMMAND: LexicalCommand<InsertUploadPayload> =
  createCommand('INSERT_UPLOAD_COMMAND')

export function UploadPlugin({
  captionsEnabled,
}: {
  captionsEnabled?: boolean
}): JSX.Element | null {
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
          // This is run on the browser. Can't just use 'payload' object
          console.log('Received INSERT_UPLOAD_COMMAND with payload', INSERT_UPLOAD_COMMAND)
          editor.update(() => {
            const uploadNode = $createUploadNode({
              fields: {
                relationTo: payload.relationTo,
                value: {
                  id: payload.id,
                },
              },
            })

            $insertNodes([uploadNode])
            if ($isRootOrShadowRoot(uploadNode.getParentOrThrow())) {
              $wrapNodeInElement(uploadNode, $createParagraphNode).selectEnd()
            }
          })

          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    )
  }, [captionsEnabled, editor])

  return <UploadDrawer enabledCollectionSlugs={collections.map(({ slug }) => slug)} />
}
