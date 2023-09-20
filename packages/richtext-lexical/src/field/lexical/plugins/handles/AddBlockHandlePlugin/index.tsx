/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getNodeByKey, $getRoot, type LexicalEditor, type LexicalNode } from 'lexical'
import * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { isHTMLElement } from '../../../utils/guard'
import { Point } from '../../../utils/point'
import { Rect } from '../../../utils/rect'
import { getCollapsedMargins } from '../utils/getCollapsedMargins'
import { getTopLevelNodeKeys } from '../utils/getTopLevelNodeKeys'
import { isOnHandleElement } from '../utils/isOnHandleElement'
import { setHandlePosition } from '../utils/setHandlePosition'
import './index.scss'

const SPACE = -24
const ADD_BLOCK_MENU_CLASSNAME = 'add-block-menu'

const Downward = 1
const Upward = -1
const Indeterminate = 0

let prevIndex = Infinity

function getCurrentIndex(keysLength: number): number {
  if (keysLength === 0) {
    return Infinity
  }
  if (prevIndex >= 0 && prevIndex < keysLength) {
    return prevIndex
  }

  return Math.floor(keysLength / 2)
}

function getBlockElement(
  anchorElem: HTMLElement,
  editor: LexicalEditor,
  event: MouseEvent,
  useEdgeAsDefault = false,
  horizontalOffset = 0,
): HTMLElement | null {
  const anchorElementRect = anchorElem.getBoundingClientRect()
  const topLevelNodeKeys = getTopLevelNodeKeys(editor)

  let blockElem: HTMLElement | null = null
  let blockNode: LexicalNode | null = null

  // Return null if matching block element is the first or last node
  editor.getEditorState().read(() => {
    if (useEdgeAsDefault) {
      const [firstNode, lastNode] = [
        editor.getElementByKey(topLevelNodeKeys[0]),
        editor.getElementByKey(topLevelNodeKeys[topLevelNodeKeys.length - 1]),
      ]

      const [firstNodeRect, lastNodeRect] = [
        firstNode?.getBoundingClientRect(),
        lastNode?.getBoundingClientRect(),
      ]

      if (firstNodeRect && lastNodeRect) {
        if (event.y < firstNodeRect.top) {
          blockElem = firstNode
        } else if (event.y > lastNodeRect.bottom) {
          blockElem = lastNode
        }

        if (blockElem) {
          return
        }
      }
    }

    // Find matching block element
    let index = getCurrentIndex(topLevelNodeKeys.length)
    let direction = Indeterminate

    while (index >= 0 && index < topLevelNodeKeys.length) {
      const key = topLevelNodeKeys[index]
      const elem = editor.getElementByKey(key)
      if (elem === null) {
        break
      }
      const point = new Point(event.x + horizontalOffset, event.y)
      const domRect = Rect.fromDOM(elem)
      const { marginBottom, marginTop } = getCollapsedMargins(elem)

      const rect = domRect.generateNewRect({
        bottom: domRect.bottom + marginBottom,
        left: anchorElementRect.left,
        right: anchorElementRect.right,
        top: domRect.top - marginTop,
      })

      const {
        reason: { isOnBottomSide, isOnTopSide },
        result,
      } = rect.contains(point)

      if (result) {
        blockElem = elem
        blockNode = $getNodeByKey(key)
        prevIndex = index

        // Check if blockNode is an empty text node
        if (
          !blockNode ||
          blockNode.getType() !== 'paragraph' ||
          blockNode.getTextContent() !== ''
        ) {
          blockElem = null
        }
        break
      }

      if (direction === Indeterminate) {
        if (isOnTopSide) {
          direction = Upward
        } else if (isOnBottomSide) {
          direction = Downward
        } else {
          // stop search block element
          direction = Infinity
        }
      }

      index += direction
    }
  })

  return blockElem
}

function useAddBlockHandle(
  editor: LexicalEditor,
  anchorElem: HTMLElement,
  isEditable: boolean,
): JSX.Element {
  const scrollerElem = anchorElem.parentElement

  const menuRef = useRef<HTMLDivElement>(null)
  const [draggableBlockElem, setDraggableBlockElem] = useState<HTMLElement | null>(null)

  useEffect(() => {
    function onDocumentMouseMove(event: MouseEvent) {
      const target = event.target
      if (!isHTMLElement(target)) {
        return
      }

      let distanceFromScrollerElem = 0
      // Calculate distance between scrollerElem and target if target is not in scrollerElem
      if (scrollerElem && !scrollerElem.contains(target)) {
        const { bottom, left, right, top } = scrollerElem.getBoundingClientRect()
        const { pageX, pageY } = event
        const horizontalBuffer = 50
        const verticalBuffer = 25
        if (
          pageY < top - verticalBuffer ||
          pageY > bottom + verticalBuffer ||
          pageX < left - horizontalBuffer ||
          pageX > right + horizontalBuffer
        ) {
          setDraggableBlockElem(null)
          return
        }

        // This is used to allow the _draggableBlockElem to be found when the mouse is in the
        // buffer zone around the scrollerElem.
        if (pageX < left || pageX > right) {
          distanceFromScrollerElem = pageX < left ? pageX - left : pageX - right
        }
      }

      if (isOnHandleElement(target, ADD_BLOCK_MENU_CLASSNAME)) {
        return
      }
      const _draggableBlockElem = getBlockElement(
        anchorElem,
        editor,
        event,
        false,
        -distanceFromScrollerElem,
      )
      if (!_draggableBlockElem) {
        return
      }

      setDraggableBlockElem(_draggableBlockElem)
    }

    // Since the draggableBlockElem is outside the actual editor, we need to listen to the document
    // to be able to detect when the mouse is outside the editor and respect a buffer around the
    // the scrollerElem to avoid the draggableBlockElem disappearing too early.
    document?.addEventListener('mousemove', onDocumentMouseMove)

    return () => {
      document?.removeEventListener('mousemove', onDocumentMouseMove)
    }
  }, [scrollerElem, anchorElem, editor])

  useEffect(() => {
    if (menuRef.current) {
      setHandlePosition(draggableBlockElem, menuRef.current, anchorElem, SPACE)
    }
  }, [anchorElem, draggableBlockElem])

  return createPortal(
    <React.Fragment>
      <div className="icon add-block-menu" ref={menuRef}>
        <div className={isEditable ? 'icon' : ''} />
      </div>
    </React.Fragment>,
    anchorElem,
  )
}

export function AddBlockHandlePlugin({
  anchorElem = document.body,
}: {
  anchorElem?: HTMLElement
}): JSX.Element {
  const [editor] = useLexicalComposerContext()
  return useAddBlockHandle(editor, anchorElem, editor._editable)
}
