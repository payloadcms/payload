'use client'
import type { LexicalCommand } from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { $dfsIterator, $insertNodeToNearestRoot, mergeRegister } from '@lexical/utils'
import { useBulkUpload, useConfig, useEffectEvent, useModal } from '@payloadcms/ui'
import ObjectID from 'bson-objectid'
import {
  $getPreviousSelection,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
} from 'lexical'
import React, { useEffect } from 'react'

import type { PluginComponent } from '../../../typesClient.js'
import type { UploadData } from '../../server/nodes/UploadNode.js'
import type { UploadFeaturePropsClient } from '../index.js'

import { UploadDrawer } from '../drawer/index.js'
import { $isPendingUploadNode, PendingUploadNode } from '../nodes/PendingUploadNode.js'
import { $createUploadNode, UploadNode } from '../nodes/UploadNode.js'

export type InsertUploadPayload = Readonly<Omit<UploadData, 'id'> & Partial<Pick<UploadData, 'id'>>>

export const INSERT_UPLOAD_COMMAND: LexicalCommand<InsertUploadPayload> =
  createCommand('INSERT_UPLOAD_COMMAND')

type ImageToUpload = {
  alt?: string
  file: File
  id: string
}

export const UploadPlugin: PluginComponent<UploadFeaturePropsClient> = () => {
  const [editor] = useLexicalComposerContext()
  const {
    config: { collections },
  } = useConfig()

  const {
    drawerSlug: bulkUploadDrawerSlug,
    initialForms,
    setCollectionSlug,
    setInitialForms,
    setOnCancel,
    setOnSuccess,
    setSelectableCollections,
  } = useBulkUpload()

  const { isModalOpen, openModal } = useModal()

  const openBulkUpload = useEffectEvent(({ image }: { image: ImageToUpload }) => {
    if (!image) {
      return
    }

    if (isModalOpen(bulkUploadDrawerSlug)) {
      // Modal already open => just add form, rest has already been done
      setInitialForms([
        ...(initialForms ?? []),
        {
          file: image.file,
          formID: image.id,
        },
      ])
    } else {
      setCollectionSlug('uploads') // TODO
      setSelectableCollections(collections.filter(({ upload }) => !!upload).map(({ slug }) => slug))

      setInitialForms([
        {
          file: image.file,
          formID: image.id,
        },
      ])

      setOnCancel(() => {
        // Remove all the images that were added but not uploaded
        editor.update(() => {
          for (const dfsNode of $dfsIterator()) {
            const node = dfsNode.node

            if ($isPendingUploadNode(node)) {
              node.remove()
            }
          }
        })
      })

      setOnSuccess((newDocs) => {
        const newDocsMap = new Map(newDocs.map((doc) => [doc.formID, doc]))
        editor.update(() => {
          for (const dfsNode of $dfsIterator()) {
            const node = dfsNode.node
            if ($isPendingUploadNode(node)) {
              const newDoc = newDocsMap.get(node.getData().formID)
              if (newDoc) {
                node.replace(
                  $createUploadNode({
                    data: {
                      id: new ObjectID.default().toHexString(),
                      fields: newDoc.doc,
                      relationTo: newDoc.collectionSlug,
                      value: newDoc.doc.id,
                    },
                  }),
                )
              }
            }
          }
        })

        /*
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
        */
      })

      openModal(bulkUploadDrawerSlug)
    }
  })

  useEffect(() => {
    if (!editor.hasNodes([UploadNode])) {
      throw new Error('UploadPlugin: UploadNode not registered on editor')
    }

    return mergeRegister(
      /**
       * Handle auto-uploading images if you copy & paste an image from the clipboard
       */
      editor.registerNodeTransform(PendingUploadNode, (node) => {
        const nodeData = node.getData()
        async function upload() {
          let transformedImage: ImageToUpload | null = null

          const src = nodeData.src
          const formID = nodeData.formID
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
            transformedImage = { id: formID, alt: undefined, file }
          } else if (src.startsWith('http') || src.startsWith('https')) {
            // It's an image URL
            const res = await fetch(src)
            const blob = await res.blob()
            const file = new File([blob], 'pasted-image.' + blob.type.split('/')[1], {
              type: blob.type,
            })

            transformedImage = { id: formID, alt: undefined, file }
          }

          if (!transformedImage) {
            return
          }

          openBulkUpload({ image: transformedImage })
        }
        void upload()
      }),
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
    )
  }, [editor])

  return <UploadDrawer enabledCollectionSlugs={collections.map(({ slug }) => slug)} />
}
