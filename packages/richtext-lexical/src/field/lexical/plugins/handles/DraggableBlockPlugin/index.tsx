'use client'
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
import { getTopLevelNodeKeys } from '../utils/getTopLevelNodeKeys'
import { isOnHandleElement } from '../utils/isOnHandleElement'
import { setHandlePosition } from '../utils/setHandlePosition'
import { getBoundingClientRectWithoutTransform } from './getBoundingRectWithoutTransform'
import { getNodeCloseToPoint } from './getNodeCloseToPoint'
import './index.scss'
import { setTargetLine } from './setTargetLine'

const SPACE = -24
const DRAGGABLE_BLOCK_MENU_CLASSNAME = 'draggable-block-menu'
const DRAG_DATA_FORMAT = 'application/x-lexical-drag-block'

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
  dataTransfer.setDragImage(draggableBlockElem, 0, 0)

  setTimeout(() => {
    draggableBlockElem.style.transform = transform
  })
}

function hideTargetLine(
  targetLineElem: HTMLElement | null,
  lastTargetBlockElem: HTMLElement | null,
) {
  if (targetLineElem) {
    targetLineElem.style.opacity = '0'
  }
  if (lastTargetBlockElem) {
    lastTargetBlockElem.style.opacity = '1'
    lastTargetBlockElem.style.transform = 'translate(0, 0)'
    //lastTargetBlockElem.style.border = 'none'
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

        const adjustedTop = top + window.scrollY
        const adjustedBottom = bottom + window.scrollY

        if (
          pageY < adjustedTop - verticalBuffer ||
          pageY > adjustedBottom + verticalBuffer ||
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

      if (draggableBlockElem !== _draggableBlockElem) {
        setDraggableBlockElem(_draggableBlockElem)
      }
    }

    // Since the draggableBlockElem is outside the actual editor, we need to listen to the document
    // to be able to detect when the mouse is outside the editor and respect a buffer around the
    // the scrollerElem to avoid the draggableBlockElem disappearing too early.
    document?.addEventListener('mousemove', onDocumentMouseMove)

    return () => {
      document?.removeEventListener('mousemove', onDocumentMouseMove)
    }
  }, [scrollerElem, anchorElem, editor, calculateDistanceFromScrollerElem, draggableBlockElem])

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
      // targetBlockElem === null shouldn't happen
      if (targetBlockElem === null || targetLineElem === null) {
        return false
      }

      if (draggableBlockElem !== targetBlockElem) {
        setTargetLine(
          SPACE,
          targetLineElem,
          targetBlockElem,
          lastTargetBlockElem,
          pageY,
          anchorElem,
          event,
          debugHighlightRef,
          isFoundNodeEmptyParagraph,
        )

        // Prevent default event to be able to trigger onDrop events
        // Calling preventDefault() adds the green plus icon to the cursor,
        // indicating that the drop is allowed.
        event.preventDefault()
      } else {
        hideTargetLine(targetLineElem, lastTargetBlockElem)
      }

      setLastTargetBlockElem(targetBlockElem)

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

        const { blockElem: targetBlockElem, isFoundNodeEmptyParagraph } = getNodeCloseToPoint({
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

        const { height: targetBlockElemHeight, top: targetBlockElemTop } =
          getBoundingClientRectWithoutTransform(targetBlockElem)

        const mouseY = pageY
        const isBelow = mouseY >= targetBlockElemTop + targetBlockElemHeight / 2 + window.scrollY

        if (!isFoundNodeEmptyParagraph) {
          if (isBelow) {
            // below targetBlockElem
            targetNode.insertAfter(draggedNode)
          } else {
            // above targetBlockElem
            targetNode.insertBefore(draggedNode)
          }
        } else {
          //
          targetNode.insertBefore(draggedNode)
          targetNode.remove()
        }

        /*
        if (pageY >= targetBlockElemTop + targetBlockElemHeight / 2) {
          targetNode.insertAfter(draggedNode)
        } else {
          targetNode.insertBefore(draggedNode)
        }*/
        if (draggableBlockElem !== null) {
          setDraggableBlockElem(null)
        }
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
  }, [
    anchorElem,
    editor,
    lastTargetBlockElem,
    calculateDistanceFromScrollerElem,
    draggableBlockElem,
  ])

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
