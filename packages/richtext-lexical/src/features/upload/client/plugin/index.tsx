'use client'
import type { LexicalCommand } from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { $insertNodeToNearestRoot, mergeRegister } from '@lexical/utils'
import { useBulkUpload, useConfig, useModal } from '@payloadcms/ui'
import ObjectID from 'bson-objectid'
import {
  $getPreviousSelection,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_LOW,
  createCommand,
  PASTE_COMMAND,
} from 'lexical'
import { useRouter } from 'next/navigation.js'
import React, { useCallback, useEffect } from 'react'

import type { PluginComponent } from '../../../typesClient.js'
import type { UploadData } from '../../server/nodes/UploadNode.js'
import type { UploadFeaturePropsClient } from '../index.js'

import { UploadDrawer } from '../drawer/index.js'
import { $createUploadNode, UploadNode } from '../nodes/UploadNode.js'

export type InsertUploadPayload = Readonly<Omit<UploadData, 'id'> & Partial<Pick<UploadData, 'id'>>>

export const INSERT_UPLOAD_COMMAND: LexicalCommand<InsertUploadPayload> =
  createCommand('INSERT_UPLOAD_COMMAND')

type ImageToUpload = {
  alt?: string
  file: File
  id: string
}

export const UploadPlugin: PluginComponent<UploadFeaturePropsClient> = ({ clientProps }) => {
  const [editor] = useLexicalComposerContext()
  const {
    config: { collections },
  } = useConfig()

  const [imagesToUpload, setImagesToUpload] = React.useState<Array<ImageToUpload>>([])

  const {
    drawerSlug: bulkUploadDrawerSlug,
    setCollectionSlug,
    setInitialForms,
    setOnSuccess,
    setSelectableCollections,
  } = useBulkUpload()

  const { openModal } = useModal()
  const router = useRouter()

  const openBulkUpload = React.useCallback(
    ({ images }: { images: Array<ImageToUpload> }) => {
      if (!images.length) {
        return
      }

      setCollectionSlug('uploads')
      setSelectableCollections(collections.filter(({ upload }) => !!upload).map(({ slug }) => slug))

      setInitialForms(
        images.map(({ id, file }) => {
          return {
            file,
            formID: id,
          }
        }),
      )

      setOnSuccess(() => {
        router.refresh()
      })

      openModal(bulkUploadDrawerSlug)
    },
    [
      setCollectionSlug,
      setSelectableCollections,
      collections,
      setInitialForms,
      setOnSuccess,
      openModal,
      bulkUploadDrawerSlug,
      router,
    ],
  )

  const handleImagesUpload = useCallback(
    async ({ images }: { images: Array<ImageToUpload> }) => {
      setImagesToUpload(images)
      openBulkUpload({ images })

      // Create all the lexical nodes pointing to images that do not exist yet
      images.forEach((image) => {
        // TODO: Should be done in node importDOM for
        // - optimal positioning
        //
        // Inside onSuccess we'd then find each node and update it.
        // Maybe even add a pending state to node OR create a PendingUploadNode.
        // TODO: We would only do this if you actually drag image files in here
        editor.dispatchCommand(INSERT_UPLOAD_COMMAND, {
          fields: null,
          relationTo: 'uploads', // TODO: Should be undefined and set later,
          value: image.id,
        })
      })

      /* const formData = new FormData()

        // Use the file in the formData
        formData.append('file', images[0].file)
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
        })*/
    },
    [openBulkUpload],
  )

  useEffect(() => {
    if (!editor.hasNodes([UploadNode])) {
      throw new Error('UploadPlugin: UploadNode not registered on editor')
    }

    return mergeRegister(
      editor.registerCommand<InsertUploadPayload>(
        INSERT_UPLOAD_COMMAND,
        (payload: InsertUploadPayload) => {
          editor.update(() => {
            const selection = $getSelection() || $getPreviousSelection()

            if ($isRangeSelection(selection)) {
              const uploadNode = $createUploadNode({
                data: {
                  id: payload.id,
                  fields: payload.fields,
                  relationTo: payload.relationTo,
                  value: payload.value,
                },
              })
              // we need to get the focus node before inserting the block node, as $insertNodeToNearestRoot can change the focus node
              const { focus } = selection
              const focusNode = focus.getNode()
              // Insert upload node BEFORE potentially removing focusNode, as $insertNodeToNearestRoot errors if the focusNode doesn't exist
              $insertNodeToNearestRoot(uploadNode)

              // Delete the node it it's an empty paragraph
              if ($isParagraphNode(focusNode) && !focusNode.__first) {
                focusNode.remove()
              }
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
          if (!(event instanceof ClipboardEvent)) {
            return false
          }
          const clipboardData = event.clipboardData

          if (!clipboardData?.types?.includes('text/html')) {
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

          async function upload() {
            const transformedImages: Array<ImageToUpload> = []

            for (const img of images) {
              const src = img.src
              const imageID = new ObjectID.default().toHexString()
              if (src.startsWith('data:')) {
                // It's a base64-encoded image
                const mimeMatch = src.match(/data:(image\/[a-zA-Z]+);base64,/)
                const mimeType = mimeMatch ? mimeMatch[1] : 'image/png' // Default to PNG if MIME type not found
                const base64Data = src.replace(/^data:image\/[a-zA-Z]+;base64,/, '')
                const byteCharacters = atob(base64Data)
                const byteNumbers = new Array(byteCharacters.length)
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i)
                }
                const byteArray = new Uint8Array(byteNumbers)
                const file = new File([byteArray], 'pasted-image.' + mimeType?.split('/')[1], {
                  type: mimeType,
                })
                transformedImages.push({ id: imageID, alt: img.alt || undefined, file })
              } else if (src.startsWith('http') || src.startsWith('https')) {
                // It's an image URL
                const res = await fetch(src)
                const blob = await res.blob()
                const file = new File([blob], 'pasted-image.' + blob.type.split('/')[1], {
                  type: blob.type,
                })

                transformedImages.push({ id: imageID, alt: img.alt || undefined, file })
              }
            }

            await handleImagesUpload({ images: transformedImages })
          }
          void upload()

          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
    )
  }, [editor, handleImagesUpload])

  return <UploadDrawer enabledCollectionSlugs={collections.map(({ slug }) => slug)} />
}
