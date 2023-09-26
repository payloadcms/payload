/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { LexicalEditor } from 'lexical'
import type { DragEvent as ReactDragEvent } from 'react'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { eventFiles } from '@lexical/rich-text'
import { $getNearestNodeFromDOMNode, $getNodeByKey } from 'lexical'
import * as React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { isHTMLElement } from '../../../utils/guard'
import { Point } from '../../../utils/point'
import { getCollapsedMargins } from '../utils/getCollapsedMargins'
import { getTopLevelNodeKeys } from '../utils/getTopLevelNodeKeys'
import { isOnHandleElement } from '../utils/isOnHandleElement'
import { setHandlePosition } from '../utils/setHandlePosition'
import { getBoundingClientRectWithoutTransform } from './getBoundingRectWithoutTransform'
import { getNodeCloseToPoint } from './getNodeCloseToPoint'
import { highlightElemOriginalPosition } from './highlightElemOriginalPosition'
import './index.scss'

const SPACE = -24
const TARGET_LINE_HALF_HEIGHT = 25
const DRAGGABLE_BLOCK_MENU_CLASSNAME = 'draggable-block-menu'
const DRAG_DATA_FORMAT = 'application/x-lexical-drag-block'
const TEXT_BOX_HORIZONTAL_PADDING = -24
const DEBUG = false

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
  lastTargetBlockElem: HTMLElement | null,
  mouseY: number,
  anchorElem: HTMLElement,
  event: DragEvent,
  debugHighlightRef: React.RefObject<HTMLDivElement>,
  isFoundNodeEmptyParagraph: boolean = false,
) {
  const { height: targetBlockElemHeight, top: targetBlockElemTop } =
    getBoundingClientRectWithoutTransform(targetBlockElem)
  const { top: anchorTop, width: anchorWidth } = anchorElem.getBoundingClientRect()

  const { marginBottom, marginTop } = getCollapsedMargins(targetBlockElem)
  let lineTop = targetBlockElemTop
  if (!isFoundNodeEmptyParagraph) {
    if (mouseY >= targetBlockElemTop) {
      lineTop += targetBlockElemHeight + marginBottom / 2
    } else {
      lineTop -= marginTop / 2
    }
  } else {
    lineTop += targetBlockElemHeight / 2
    console.log('isFoundNodeEmptyParagraph', lineTop)
  }

  const top = lineTop - anchorTop - TARGET_LINE_HALF_HEIGHT
  const left = TEXT_BOX_HORIZONTAL_PADDING - SPACE

  targetLineElem.style.transform = `translate(${left}px, ${top}px)`
  targetLineElem.style.width = `${anchorWidth - (TEXT_BOX_HORIZONTAL_PADDING - SPACE) * 2}px`
  targetLineElem.style.opacity = '.4'

  targetBlockElem.style.opacity = '0.4'
  if (!isFoundNodeEmptyParagraph) {
    // move lastTargetBlockElem down 50px to make space for targetLineElem (which is 50px height)
    if (event.pageY >= targetBlockElemTop) {
      targetBlockElem.style.transform = `translate(0, ${-TARGET_LINE_HALF_HEIGHT / 1.9}px)`
    } else {
      targetBlockElem.style.transform = `translate(0, ${TARGET_LINE_HALF_HEIGHT / 1.9}px)`
    }
  }

  if (DEBUG) {
    //targetBlockElem.style.border = '3px solid red'
    highlightElemOriginalPosition(debugHighlightRef, targetBlockElem, anchorElem)
  }

  if (lastTargetBlockElem && lastTargetBlockElem !== targetBlockElem) {
    lastTargetBlockElem.style.opacity = '1'
    lastTargetBlockElem.style.transform = 'translate(0, 0)'
    lastTargetBlockElem.style.border = 'none'
  }
}

function hideTargetLine(
  targetLineElem: HTMLElement | null,
  lastTargetBlockElem: HTMLElement | null,
) {
  if (targetLineElem) {
    targetLineElem.style.opacity = '0'
    targetLineElem.style.transform = 'translate(-10000px, -10000px)'
  }
  if (lastTargetBlockElem) {
    lastTargetBlockElem.style.opacity = '1'
    lastTargetBlockElem.style.transform = 'translate(0, 0)'
    lastTargetBlockElem.style.border = 'none'
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
  const debugHighlightRef = useRef<HTMLDivElement>(null)
  const isDraggingBlockRef = useRef<boolean>(false)
  const [draggableBlockElem, setDraggableBlockElem] = useState<HTMLElement | null>(null)
  const [lastTargetBlockElem, setLastTargetBlockElem] = useState<HTMLElement | null>(null)

  const calculateDistanceFromScrollerElem = useCallback(
    (
      pageX: number,
      pageY: number,
      target: HTMLElement,
      horizontalBuffer: number = 50,
      verticalBuffer: number = 25,
    ): number => {
      let distanceFromScrollerElem = 0
      // Calculate distance between scrollerElem and target if target is not in scrollerElem
      if (scrollerElem && !scrollerElem.contains(target)) {
        const { bottom, left, right, top } = scrollerElem.getBoundingClientRect()
        if (
          pageY < top - verticalBuffer ||
          pageY > bottom + verticalBuffer ||
          pageX < left - horizontalBuffer ||
          pageX > right + horizontalBuffer
        ) {
          setDraggableBlockElem(null)
          return distanceFromScrollerElem
        }

        // This is used to allow the _draggableBlockElem to be found when the mouse is in the
        // buffer zone around the scrollerElem.
        if (pageX < left || pageX > right) {
          distanceFromScrollerElem = pageX < left ? pageX - left : pageX - right
        }
      }
      return distanceFromScrollerElem
    },
    [scrollerElem],
  )

  useEffect(() => {
    /**
     * Handles positioning of the drag handle
     */
    function onDocumentMouseMove(event: MouseEvent) {
      const target = event.target
      if (!isHTMLElement(target)) {
        return
      }

      const distanceFromScrollerElem = calculateDistanceFromScrollerElem(
        event.pageX,
        event.pageY,
        target,
      )

      if (isOnHandleElement(target, DRAGGABLE_BLOCK_MENU_CLASSNAME)) {
        return
      }

      const topLevelNodeKeys = getTopLevelNodeKeys(editor)
      const {
        blockElem: _draggableBlockElem,
        foundAtIndex,
        isFoundNodeEmptyParagraph,
      } = getNodeCloseToPoint({
        anchorElem,
        cache_treshold: 0,
        editor,
        horizontalOffset: -distanceFromScrollerElem,
        point: new Point(event.x, event.y),
        startIndex: getCurrentIndex(topLevelNodeKeys.length),
        useEdgeAsDefault: false,
      })
      //if (DEBUG && _draggableBlockElem) {
      //targetBlockElem.style.border = '3px solid red'
      // highlightElemOriginalPosition(debugHighlightRef, _draggableBlockElem, anchorElem)
      //}
      prevIndex = foundAtIndex

      if (!_draggableBlockElem && !isFoundNodeEmptyParagraph) {
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
  }, [scrollerElem, anchorElem, editor, calculateDistanceFromScrollerElem])

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

      const distanceFromScrollerElem = calculateDistanceFromScrollerElem(
        event.pageX,
        event.pageY,
        target,
        100,
        50,
      )

      const topLevelNodeKeys = getTopLevelNodeKeys(editor)

      const {
        blockElem: targetBlockElem,
        foundAtIndex,
        isFoundNodeEmptyParagraph,
      } = getNodeCloseToPoint({
        anchorElem,
        editor,
        fuzzy: true,
        horizontalOffset: -distanceFromScrollerElem,
        point: new Point(event.x, event.y),
        startIndex: getCurrentIndex(topLevelNodeKeys.length),
        useEdgeAsDefault: true,
        verbose: true,
      })
      prevIndex = foundAtIndex

      const targetLineElem = targetLineRef.current
      // TODO: targetBlockElem === null shouldnt happen (it being null). getBlockElement needs to find stuff more often
      if (targetBlockElem === null || targetLineElem === null) {
        return false
      }

      setTargetLine(
        targetLineElem,
        targetBlockElem,
        lastTargetBlockElem,
        pageY,
        anchorElem,
        event,
        debugHighlightRef,
        isFoundNodeEmptyParagraph,
      )
      console.log('AAA isFoundNodeEmptyParagraph', isFoundNodeEmptyParagraph)
      setLastTargetBlockElem(targetBlockElem)
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

      editor.update(() => {
        const draggedNode = $getNodeByKey(dragData)
        if (!draggedNode) {
          return false
        }
        if (!isHTMLElement(target)) {
          return false
        }
        const distanceFromScrollerElem = calculateDistanceFromScrollerElem(
          event.pageX,
          event.pageY,
          target,
          100,
          50,
        )

        const { blockElem: targetBlockElem } = getNodeCloseToPoint({
          anchorElem,
          editor,
          fuzzy: true,
          horizontalOffset: -distanceFromScrollerElem,
          point: new Point(event.x, event.y),
          useEdgeAsDefault: true,
        })

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
      })

      return true
    }

    // register onDragover event listeners:
    document.addEventListener('dragover', onDragover)
    // register onDrop event listeners:
    document.addEventListener('drop', onDrop)

    return () => {
      document.removeEventListener('dragover', onDragover)
      document.removeEventListener('drop', onDrop)
    }
  }, [anchorElem, editor, lastTargetBlockElem, calculateDistanceFromScrollerElem])

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
    hideTargetLine(targetLineRef.current, lastTargetBlockElem)
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
      <div className="debug-highlight" ref={debugHighlightRef} />
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
