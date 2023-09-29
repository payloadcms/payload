/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $wrapNodeInElement, mergeRegister } from '@lexical/utils'
import {
  $createParagraphNode,
  $createRangeSelection,
  $getSelection,
  $insertNodes,
  $isNodeSelection,
  $isRootOrShadowRoot,
  $setSelection,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  DRAGOVER_COMMAND,
  DRAGSTART_COMMAND,
  DROP_COMMAND,
  type LexicalCommand,
  type LexicalEditor,
  createCommand,
} from 'lexical'
import { useEffect } from 'react'

import { $createImageNode, $isImageNode, ImageNode, type ImagePayload } from '../../nodes/ImageNode'

export type InsertImagePayload = Readonly<ImagePayload>

const getDOMSelection = (targetWindow: Window | null): Selection | null =>
  CAN_USE_DOM ? (targetWindow ?? window).getSelection() : null

export const INSERT_IMAGE_COMMAND: LexicalCommand<InsertImagePayload> =
  createCommand('INSERT_IMAGE_COMMAND')

export default function UploadPlugin({
  captionsEnabled,
}: {
  captionsEnabled?: boolean
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (!editor.hasNodes([ImageNode])) {
      throw new Error('ImagesPlugin: ImageNode not registered on editor')
    }

    return mergeRegister(
      editor.registerCommand<InsertImagePayload>(
        INSERT_IMAGE_COMMAND,
        (insertImagePayload: ImagePayload) => {
          // This is run on the browser. Can't just use 'payload' object
          console.log('Received INSERT_IMAGE_COMMAND with payload', insertImagePayload)
          editor.update(() => {
            const imageNode = $createImageNode(
              insertImagePayload.rawImagePayload,
              {
                heightOverride: undefined,
                widthOverride: undefined,
              },
              insertImagePayload?.showCaption,
              insertImagePayload?.caption,
              insertImagePayload?.captionsEnabled,
            )
            $insertNodes([imageNode])
            if ($isRootOrShadowRoot(imageNode.getParentOrThrow())) {
              $wrapNodeInElement(imageNode, $createParagraphNode).selectEnd()
            }
          })

          /* const relatedCollection = collections.find((coll) => {
            console.log('coll.slug', coll.slug, 'insertImagePayload.relationTo', insertImagePayload.relationTo);
            return coll.slug === insertImagePayload.relationTo;
          });

          requests.get(`${serverURL}${api}/${relatedCollection?.slug}/${insertImagePayload.value?.id}`, {
            headers: {
              'Accept-Language': i18n.language,
            },
          }).then((response) => {
            response.json().then((json) => {
              console.log('JSON', json);

              const imagePayload: ImagePayload = {
                altText: json?.text,
                height: json?.height,
                maxWidth: json?.width,
                src: json?.url,
              };
              console.log('image payload', imagePayload);
              editor.update(() => {
                const imageNode = $createImageNode(imagePayload);
                $insertNodes([imageNode]);
                if ($isRootOrShadowRoot(imageNode.getParentOrThrow())) {
                  $wrapNodeInElement(imageNode, $createParagraphNode).selectEnd();
                }
              });
            });
          });


          console.log('relatedCollection', relatedCollection);
*/
          /*
          const { collections, serverURL, routes: { api } } = payload.config;
          const relatedCollection = collections.find((coll) => coll.slug === insertImagePayload.relationTo);

          console.log('relatedCollection', relatedCollection);

          // Get the referenced document
          const foundReferencedUploadDocument = payload.find(
            {
              collection: relatedCollection.slug,
              where: {
                id: {
                  equals: insertImagePayload.value
                },
              },
            },
          );

          console.log('foundReferencedUploadDocument', foundReferencedUploadDocument);


          /* const imageNode = $createImageNode(payload);
          $insertNodes([imageNode]);
          if ($isRootOrShadowRoot(imageNode.getParentOrThrow())) {
            $wrapNodeInElement(imageNode, $createParagraphNode).selectEnd();
          } */

          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand<DragEvent>(
        DRAGSTART_COMMAND,
        (event) => {
          return onDragStart(event)
        },
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand<DragEvent>(
        DRAGOVER_COMMAND,
        (event) => {
          return onDragover(event)
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand<DragEvent>(
        DROP_COMMAND,
        (event) => {
          return onDrop(event, editor)
        },
        COMMAND_PRIORITY_HIGH,
      ),
    )
  }, [captionsEnabled, editor])

  return null
}

const TRANSPARENT_IMAGE =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
let img: HTMLImageElement

function onDragStart(event: DragEvent): boolean {
  const node = getImageNodeInSelection()
  if (node == null) {
    return false
  }
  const { dataTransfer } = event
  if (dataTransfer == null) {
    return false
  }
  dataTransfer.setData('text/plain', '_')
  // TODO: eslint typescript - allways true? from let img: HTMLImageElement; above?
  if (img == null) {
    img = document.createElement('img')
    img.src = TRANSPARENT_IMAGE
  }
  dataTransfer.setDragImage(img, 0, 0)
  dataTransfer.setData(
    'application/x-lexical-drag',
    JSON.stringify({
      data: {
        extraAttributes: node.__extraAttributes,
        key: node.getKey(),
        rawImagePayload: node.__rawImagePayload,
      },
      type: 'upload',
    }),
  )

  return true
}

function onDragover(event: DragEvent): boolean {
  const node = getImageNodeInSelection()
  if (node == null) {
    return false
  }
  if (!canDropImage(event)) {
    event.preventDefault()
  }
  return true
}

function onDrop(event: DragEvent, editor: LexicalEditor): boolean {
  const node = getImageNodeInSelection()
  if (node == null) {
    return false
  }
  const data = getDragImageData(event)
  if (data == null) {
    return false
  }
  event.preventDefault()
  if (canDropImage(event)) {
    const range = getDragSelection(event)
    node.remove()
    const rangeSelection = $createRangeSelection()
    if (range !== null && range !== undefined) {
      rangeSelection.applyDOMRange(range)
    }
    $setSelection(rangeSelection)
    editor.dispatchCommand(INSERT_IMAGE_COMMAND, data)
  }
  return true
}

function getImageNodeInSelection(): ImageNode | null {
  const selection = $getSelection()
  if (!$isNodeSelection(selection)) {
    return null
  }
  const nodes = selection.getNodes()
  const node = nodes[0]
  return $isImageNode(node) ? node : null
}

function getDragImageData(event: DragEvent): InsertImagePayload | null {
  const dragData = event.dataTransfer?.getData('application/x-lexical-drag')
  if (dragData == null) {
    return null
  }
  const { data, type } = JSON.parse(dragData)
  if (type !== 'upload') {
    return null
  }

  return data
}

declare global {
  interface DragEvent {
    rangeOffset?: number
    rangeParent?: Node
  }
}

function canDropImage(event: DragEvent): boolean {
  const { target } = event
  return !!(
    target != null &&
    target instanceof HTMLElement &&
    target.closest('code, span.editor-image') == null &&
    target.parentElement != null &&
    target.parentElement.closest('div.ContentEditable__root') != null
  )
}

function getDragSelection(event: DragEvent): Range | null | undefined {
  let range
  const target = event.target as Document | Element | null
  const targetWindow =
    target == null
      ? null
      : target.nodeType === 9
      ? (target as Document).defaultView
      : (target as Element).ownerDocument.defaultView
  const domSelection = getDOMSelection(targetWindow)
  if (document.caretRangeFromPoint != null) {
    range = document.caretRangeFromPoint(event.clientX, event.clientY)
  } else if (event.rangeParent != null && domSelection !== null) {
    domSelection.collapse(event.rangeParent, event.rangeOffset ?? 0)
    range = domSelection.getRangeAt(0)
  } else {
    throw Error('Cannot get the selection when dragging')
  }

  return range
}
