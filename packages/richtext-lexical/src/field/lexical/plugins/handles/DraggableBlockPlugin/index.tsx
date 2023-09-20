/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { LexicalEditor, LexicalNode } from 'lexical'
import type { DragEvent as ReactDragEvent } from 'react'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { eventFiles } from '@lexical/rich-text'
import { mergeRegister } from '@lexical/utils'
import {
  $getNearestNodeFromDOMNode,
  $getNodeByKey,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  DRAGOVER_COMMAND,
  DROP_COMMAND,
} from 'lexical'
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
const TARGET_LINE_HALF_HEIGHT = 2
const DRAGGABLE_BLOCK_MENU_CLASSNAME = 'draggable-block-menu'
const DRAG_DATA_FORMAT = 'application/x-lexical-drag-block'
const TEXT_BOX_HORIZONTAL_PADDING = -24

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
): {
  blockElem: HTMLElement | null
  shouldRemove: boolean
} {
  const anchorElementRect = anchorElem.getBoundingClientRect()
  const topLevelNodeKeys = getTopLevelNodeKeys(editor)

  let blockElem: HTMLElement | null = null
  let blockNode: LexicalNode | null = null
  let shouldRemove = false

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
          return {
            blockElem: null,
            shouldRemove,
          }
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
        if (blockNode && blockNode.getType() === 'paragraph' && blockNode.getTextContent() === '') {
          blockElem = null
          shouldRemove = true
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

  return {
    blockElem: blockElem,
    shouldRemove,
  }
}

function setDragImage(dataTransfer: DataTransfer, draggableBlockElem: HTMLElement) {
  const { transform } = draggableBlockElem.style

  // Remove dragImage borders
  draggableBlockElem.style.transform = 'translateZ(0)'
  dataTransfer.setDragImage(draggableBlockElem, 0, 0)

  setTimeout(() => {
    draggableBlockElem.style.transform = transform
  })
}

function setTargetLine(
  targetLineElem: HTMLElement,
  targetBlockElem: HTMLElement,
  mouseY: number,
  anchorElem: HTMLElement,
) {
  const { height: targetBlockElemHeight, top: targetBlockElemTop } =
    targetBlockElem.getBoundingClientRect()
  const { top: anchorTop, width: anchorWidth } = anchorElem.getBoundingClientRect()

  const { marginBottom, marginTop } = getCollapsedMargins(targetBlockElem)
  let lineTop = targetBlockElemTop
  if (mouseY >= targetBlockElemTop) {
    lineTop += targetBlockElemHeight + marginBottom / 2
  } else {
    lineTop -= marginTop / 2
  }

  const top = lineTop - anchorTop - TARGET_LINE_HALF_HEIGHT
  const left = TEXT_BOX_HORIZONTAL_PADDING - SPACE

  targetLineElem.style.transform = `translate(${left}px, ${top}px)`
  targetLineElem.style.width = `${anchorWidth - (TEXT_BOX_HORIZONTAL_PADDING - SPACE) * 2}px`
  targetLineElem.style.opacity = '.4'
}

function hideTargetLine(targetLineElem: HTMLElement | null) {
  if (targetLineElem) {
    targetLineElem.style.opacity = '0'
    targetLineElem.style.transform = 'translate(-10000px, -10000px)'
  }
}

function useDraggableBlockMenu(
  editor: LexicalEditor,
  anchorElem: HTMLElement,
  isEditable: boolean,
): JSX.Element {
  const scrollerElem = anchorElem.parentElement

  const menuRef = useRef<HTMLDivElement>(null)
  const targetLineRef = useRef<HTMLDivElement>(null)
  const isDraggingBlockRef = useRef<boolean>(false)
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

      if (isOnHandleElement(target, DRAGGABLE_BLOCK_MENU_CLASSNAME)) {
        return
      }
      const { blockElem: _draggableBlockElem, shouldRemove } = getBlockElement(
        anchorElem,
        editor,
        event,
        false,
        -distanceFromScrollerElem,
      )
      if (!_draggableBlockElem && !shouldRemove) {
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

  useEffect(() => {
    function onDragover(event: DragEvent): boolean {
      if (!isDraggingBlockRef.current) {
        return false
      }
      const [isFileTransfer] = eventFiles(event)
      if (isFileTransfer) {
        return false
      }
      const { pageY, target } = event
      if (!isHTMLElement(target)) {
        return false
      }
      const { blockElem: targetBlockElem } = getBlockElement(anchorElem, editor, event, true)
      const targetLineElem = targetLineRef.current
      if (targetBlockElem === null || targetLineElem === null) {
        return false
      }
      setTargetLine(targetLineElem, targetBlockElem, pageY, anchorElem)
      // Prevent default event to be able to trigger onDrop events
      event.preventDefault()
      return true
    }

    function onDrop(event: DragEvent): boolean {
      if (!isDraggingBlockRef.current) {
        return false
      }
      const [isFileTransfer] = eventFiles(event)
      if (isFileTransfer) {
        return false
      }
      const { dataTransfer, pageY, target } = event
      const dragData = dataTransfer?.getData(DRAG_DATA_FORMAT) || ''
      const draggedNode = $getNodeByKey(dragData)
      if (!draggedNode) {
        return false
      }
      if (!isHTMLElement(target)) {
        return false
      }
      const { blockElem: targetBlockElem } = getBlockElement(anchorElem, editor, event, true)
      if (!targetBlockElem) {
        return false
      }
      const targetNode = $getNearestNodeFromDOMNode(targetBlockElem)
      if (!targetNode) {
        return false
      }
      if (targetNode === draggedNode) {
        return true
      }
      const targetBlockElemTop = targetBlockElem.getBoundingClientRect().top
      if (pageY >= targetBlockElemTop) {
        targetNode.insertAfter(draggedNode)
      } else {
        targetNode.insertBefore(draggedNode)
      }
      setDraggableBlockElem(null)

      return true
    }

    return mergeRegister(
      editor.registerCommand(
        DRAGOVER_COMMAND,
        (event) => {
          return onDragover(event)
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        DROP_COMMAND,
        (event) => {
          return onDrop(event)
        },
        COMMAND_PRIORITY_HIGH,
      ),
    )
  }, [anchorElem, editor])

  function onDragStart(event: ReactDragEvent<HTMLDivElement>): void {
    const dataTransfer = event.dataTransfer
    if (!dataTransfer || !draggableBlockElem) {
      return
    }
    setDragImage(dataTransfer, draggableBlockElem)
    let nodeKey = ''
    editor.update(() => {
      const node = $getNearestNodeFromDOMNode(draggableBlockElem)
      if (node) {
        nodeKey = node.getKey()
      }
    })
    isDraggingBlockRef.current = true
    dataTransfer.setData(DRAG_DATA_FORMAT, nodeKey)
  }

  function onDragEnd(): void {
    isDraggingBlockRef.current = false
    hideTargetLine(targetLineRef.current)
  }

  return createPortal(
    <React.Fragment>
      <div
        className="icon draggable-block-menu"
        draggable
        onDragEnd={onDragEnd}
        onDragStart={onDragStart}
        ref={menuRef}
      >
        <div className={isEditable ? 'icon' : ''} />
      </div>
      <div className="draggable-block-target-line" ref={targetLineRef} />
    </React.Fragment>,
    anchorElem,
  )
}

export function DraggableBlockPlugin({
  anchorElem = document.body,
}: {
  anchorElem?: HTMLElement
}): JSX.Element {
  const [editor] = useLexicalComposerContext()
  return useDraggableBlockMenu(editor, anchorElem, editor._editable)
}
