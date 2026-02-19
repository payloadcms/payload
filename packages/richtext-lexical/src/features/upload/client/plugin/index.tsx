'use client'
import type { LexicalCommand } from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { $dfsIterator, $insertNodeToNearestRoot, mergeRegister } from '@lexical/utils'
import { useBulkUpload, useEffectEvent, useModal } from '@payloadcms/ui'
import ObjectID from 'bson-objectid'
import {
  $createRangeSelection,
  $getPreviousSelection,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  $setSelection,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_LOW,
  createCommand,
  DROP_COMMAND,
  getDOMSelectionFromTarget,
  isHTMLElement,
  PASTE_COMMAND,
} from 'lexical'
import React, { useEffect } from 'react'

import type { PluginComponent } from '../../../typesClient.js'
import type { Internal_UploadData, UploadData } from '../../server/nodes/UploadNode.js'
import type { UploadFeaturePropsClient } from '../index.js'

import { useEnabledRelationships } from '../../../relationship/client/utils/useEnabledRelationships.js'
import { UploadDrawer } from '../drawer/index.js'
import { $createUploadNode, $isUploadNode, UploadNode } from '../nodes/UploadNode.js'

export type InsertUploadPayload = Readonly<Omit<UploadData, 'id'> & Partial<Pick<UploadData, 'id'>>>

declare global {
  interface DragEvent {
    rangeOffset?: number
    rangeParent?: Node
  }
}

function canDropImage(event: DragEvent): boolean {
  const target = event.target
  return !!(
    isHTMLElement(target) &&
    !target.closest('code, span.editor-image') &&
    isHTMLElement(target.parentElement) &&
    target.parentElement.closest('div.ContentEditable__root')
  )
}

function getDragSelection(event: DragEvent): null | Range | undefined {
  // Source: https://github.com/AlessioGr/lexical/blob/main/packages/lexical-playground/src/plugins/ImagesPlugin/index.tsx
  let range
  const domSelection = getDOMSelectionFromTarget(event.target)
  if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(event.clientX, event.clientY)
  } else if (event.rangeParent && domSelection !== null) {
    domSelection.collapse(event.rangeParent, event.rangeOffset || 0)
    range = domSelection.getRangeAt(0)
  } else {
    throw Error(`Cannot get the selection when dragging`)
  }

  return range
}

export const INSERT_UPLOAD_COMMAND: LexicalCommand<InsertUploadPayload> =
  createCommand('INSERT_UPLOAD_COMMAND')

type FileToUpload = {
  alt?: string
  file: File
  /**
   * Bulk Upload Form ID that should be created, which can then be matched
   * against the node formID if the upload is successful
   */
  formID: string
}

export const UploadPlugin: PluginComponent<UploadFeaturePropsClient> = ({ clientProps }) => {
  const [editor] = useLexicalComposerContext()

  const { enabledCollectionSlugs } = useEnabledRelationships({
    collectionSlugsBlacklist: clientProps?.disabledCollections,
    collectionSlugsWhitelist: clientProps?.enabledCollections,
    uploads: true,
  })

  const {
    drawerSlug: bulkUploadDrawerSlug,
    setCollectionSlug,
    setInitialForms,
    setOnCancel,
    setOnSuccess,
    setSelectableCollections,
  } = useBulkUpload()

  const { isModalOpen, openModal } = useModal()

  const openBulkUpload = useEffectEvent(({ files }: { files: FileToUpload[] }) => {
    if (files?.length === 0) {
      return
    }

    setInitialForms((initialForms) => [
      ...(initialForms ?? []),
      ...files.map((file) => ({
        file: file.file,
        formID: file.formID,
      })),
    ])

    if (!isModalOpen(bulkUploadDrawerSlug)) {
      if (!enabledCollectionSlugs.length || !enabledCollectionSlugs[0]) {
        return
      }

      setCollectionSlug(enabledCollectionSlugs[0])
      setSelectableCollections(enabledCollectionSlugs)

      setOnCancel(() => {
        // Remove all the pending upload nodes that were added but not uploaded
        editor.update(() => {
          for (const dfsNode of $dfsIterator()) {
            const node = dfsNode.node

            if ($isUploadNode(node)) {
              const nodeData = node.getStaleData()
              if ((nodeData as Internal_UploadData)?.pending) {
                node.remove()
              }
            }
          }
        })
      })

      setOnSuccess((newDocs) => {
        const newDocsMap = new Map(newDocs.map((doc) => [doc.formID, doc]))
        editor.update(() => {
          for (const dfsNode of $dfsIterator()) {
            const node = dfsNode.node
            if ($isUploadNode(node)) {
              const nodeData: Internal_UploadData = node.getStaleData()

              if (nodeData?.pending) {
                const newDoc = newDocsMap.get(nodeData.pending?.formID)
                if (newDoc) {
                  node.replace(
                    $createUploadNode({
                      data: {
                        id: new ObjectID.default().toHexString(),
                        fields: {},
                        relationTo: newDoc.collectionSlug,
                        value: newDoc.doc.id,
                      } as UploadData,
                    }),
                  )
                }
              }
            }
          }
        })
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
       * Handle auto-uploading files if you copy & paste an image dom element from the clipboard
       */
      editor.registerNodeTransform(UploadNode, (node) => {
        const nodeData: Internal_UploadData = node.getStaleData()
        if (!nodeData?.pending) {
          return
        }

        async function upload() {
          let transformedImage: FileToUpload | null = null

          const src = nodeData?.pending?.src
          const formID = nodeData?.pending?.formID as string

          if (src?.startsWith('data:')) {
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
            const file = new File([byteArray], 'pasted-image.' + mimeType?.split('/', 2)[1], {
              type: mimeType,
            })
            transformedImage = { alt: undefined, file, formID }
          } else if (src?.startsWith('http') || src?.startsWith('https')) {
            // It's an image URL
            const res = await fetch(src)
            const blob = await res.blob()
            const inferredFileName =
              src.split('/').pop() || 'pasted-image' + blob.type.split('/', 2)[1]
            const file = new File([blob], inferredFileName, {
              type: blob.type,
            })

            transformedImage = { alt: undefined, file, formID }
          }

          if (!transformedImage) {
            return
          }

          openBulkUpload({ files: [transformedImage] })
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
      editor.registerCommand(
        PASTE_COMMAND,
        (event) => {
          // Pending UploadNodes are automatically created when importDOM is called. However, if you paste a file from your computer
          // directly, importDOM won't be called, as it's not a HTML dom element. So we need to handle that case here.

          if (!(event instanceof ClipboardEvent)) {
            return false
          }
          const clipboardData = event.clipboardData

          if (!clipboardData?.types?.length || clipboardData?.types?.includes('text/html')) {
            // HTML is handled through importDOM => registerNodeTransform for pending UploadNode
            return false
          }

          const files: FileToUpload[] = []
          if (clipboardData?.files?.length) {
            Array.from(clipboardData.files).forEach((file) => {
              files.push({
                alt: '',
                file,
                formID: new ObjectID.default().toHexString(),
              })
            })
          }

          if (files.length) {
            // Insert a pending UploadNode for each image
            editor.update(() => {
              const selection = $getSelection() || $getPreviousSelection()

              if ($isRangeSelection(selection)) {
                for (const file of files) {
                  const pendingUploadNode = $createUploadNode({
                    data: {
                      pending: {
                        formID: file.formID,
                        src: URL.createObjectURL(file.file),
                      },
                    } as Internal_UploadData,
                  })
                  // we need to get the focus node before inserting the upload node, as $insertNodeToNearestRoot can change the focus node
                  const { focus } = selection
                  const focusNode = focus.getNode()
                  // Insert upload node BEFORE potentially removing focusNode, as $insertNodeToNearestRoot errors if the focusNode doesn't exist
                  $insertNodeToNearestRoot(pendingUploadNode)

                  // Delete the node it it's an empty paragraph
                  if ($isParagraphNode(focusNode) && !focusNode.__first) {
                    focusNode.remove()
                  }
                }
              }
            })

            // Open the bulk drawer - the node transform will not open it for us, as it does not handle blob/file uploads
            openBulkUpload({ files })

            return true
          }

          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
      // Handle drag & drop of files from the desktop into the editor
      editor.registerCommand(
        DROP_COMMAND,
        (event) => {
          if (!(event instanceof DragEvent)) {
            return false
          }

          const dt = event.dataTransfer

          if (!dt?.types?.length) {
            return false
          }

          const files: FileToUpload[] = []
          if (dt?.files?.length) {
            Array.from(dt.files).forEach((file) => {
              files.push({
                alt: '',
                file,
                formID: new ObjectID.default().toHexString(),
              })
            })
          }

          if (files.length) {
            // Prevent the default browser drop handling, which would open the file in the browser
            event.preventDefault()
            event.stopPropagation()

            // Insert a PendingUploadNode for each image
            editor.update(() => {
              if (canDropImage(event)) {
                const range = getDragSelection(event)
                const selection = $createRangeSelection()
                if (range !== null && range !== undefined) {
                  selection.applyDOMRange(range)
                }
                $setSelection(selection)

                for (const file of files) {
                  const pendingUploadNode = $createUploadNode({
                    data: {
                      pending: {
                        formID: file.formID,
                        src: URL.createObjectURL(file.file),
                      },
                    } as Internal_UploadData,
                  })
                  // we need to get the focus node before inserting the upload node, as $insertNodeToNearestRoot can change the focus node
                  const { focus } = selection
                  const focusNode = focus.getNode()
                  // Insert upload node BEFORE potentially removing focusNode, as $insertNodeToNearestRoot errors if the focusNode doesn't exist
                  $insertNodeToNearestRoot(pendingUploadNode)

                  // Delete the node it it's an empty paragraph
                  if ($isParagraphNode(focusNode) && !focusNode.__first) {
                    focusNode.remove()
                  }
                }
              }
            })

            // Open the bulk drawer - the node transform will not open it for us, as it does not handle blob/file uploads
            openBulkUpload({ files })

            return true
          }

          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
    )
  }, [editor])

  return <UploadDrawer enabledCollectionSlugs={enabledCollectionSlugs} />
}
