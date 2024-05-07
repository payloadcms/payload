'use client'
import type { LexicalCommand } from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { $insertNodeToNearestRoot, mergeRegister } from '@lexical/utils'
import { useConfig } from '@payloadcms/ui/providers/Config'
import { COMMAND_PRIORITY_LOW, PASTE_COMMAND } from 'lexical'
import {
  $getPreviousSelection,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
} from 'lexical'
import React, { useEffect } from 'react'

import type { PluginComponentWithAnchor } from '../../types.js'
import type { UploadFeaturePropsClient } from '../feature.client.js'
import type { UploadData } from '../nodes/UploadNode.js'

import { UploadDrawer } from '../drawer/index.js'
import { $createUploadNode, UploadNode } from '../nodes/UploadNode.js'

export type InsertUploadPayload = Readonly<UploadData>

export const INSERT_UPLOAD_COMMAND: LexicalCommand<InsertUploadPayload> =
  createCommand('INSERT_UPLOAD_COMMAND')

export const UploadPlugin: PluginComponentWithAnchor<UploadFeaturePropsClient> = ({
  clientProps,
}) => {
  const [editor] = useLexicalComposerContext()
  const {
    collections,
    routes: { api },
    serverURL,
  } = useConfig()

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
      /**
       * Handle auto-uploading images if you copy & paste an image from the clipboard
       */
      editor.registerCommand(
        PASTE_COMMAND,
        (event) => {
          if (!clientProps?.EXPERIMENTAL_autoUpload?.collection) {
            return false
          }
          if (!(event instanceof ClipboardEvent)) {
            return false
          }
          const clipboardData = event.clipboardData

          if (!clipboardData.types.includes('text/html')) {
            return false
          }

          // Get the HTML content from the clipboard
          const html = clipboardData.getData('text/html')

          // Use a DOMParser to parse the HTML string
          const parser = new DOMParser()
          const doc = parser.parseFromString(html, 'text/html')

          // Look for image elements in the parsed HTML
          const images = doc.querySelectorAll('img')

          if (images?.length === 0) {
            return false
          }

          for (const img of images) {
            const src = img.src
            const formData = new FormData()

            console.log('IMG', img)

            const uploadImage = async () => {
              const response = await fetch(src)
              const blob = await response.blob()

              // Extract the filename from the image URL
              const filename = src
                .split('/')
                .pop()
                .split('#')[0]
                .split('?')[0]
                .replace(/[^\w.\\]/g, '')

              // Use the MIME type from the blob
              const mimeType = blob.type

              // Create a File from the blob using the original image's filename and MIME type
              const file = new File([blob], filename, { type: mimeType })

              // Use the file in the formData
              formData.append('file', file)
              //formData.append('_payload', JSON.stringify({ creator: creatorID }))

              const result = await fetch(
                `${serverURL}${api}/${clientProps?.EXPERIMENTAL_autoUpload?.collection}`,
                {
                  body: formData,
                  credentials: 'include',
                  method: 'POST',
                },
              )

              const data = await result.json()

              editor.dispatchCommand(INSERT_UPLOAD_COMMAND, {
                fields: null,
                relationTo: clientProps?.EXPERIMENTAL_autoUpload?.collection,
                value: data.doc.id,
              })
            }

            void uploadImage()
          }

          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
    )
  }, [api, clientProps?.EXPERIMENTAL_autoUpload?.collection, editor, serverURL])

  return <UploadDrawer enabledCollectionSlugs={collections.map(({ slug }) => slug)} />
}
