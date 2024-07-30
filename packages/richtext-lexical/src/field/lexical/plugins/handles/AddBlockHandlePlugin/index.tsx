'use client'
import type { ParagraphNode } from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $createParagraphNode } from 'lexical'
import { $getNodeByKey, type LexicalEditor, type LexicalNode } from 'lexical'
import * as React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { isHTMLElement } from '../../../utils/guard'
import { Point } from '../../../utils/point'
import { Rect } from '../../../utils/rect'
import { ENABLE_SLASH_MENU_COMMAND } from '../../SlashMenu/LexicalTypeaheadMenuPlugin'
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
): {
  blockElem: HTMLElement | null
  blockNode: LexicalNode | null
} {
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
          return {
            blockElem: null,
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
    blockElem,
    blockNode,
  }
}

function useAddBlockHandle(
  editor: LexicalEditor,
  anchorElem: HTMLElement,
  isEditable: boolean,
): JSX.Element {
  const scrollerElem = anchorElem.parentElement

  const menuRef = useRef<HTMLButtonElement>(null)
  const [hoveredElement, setHoveredElement] = useState<{
    elem: HTMLElement
    node: LexicalNode
  } | null>(null)

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
        const adjustedTop = top + window.scrollY
        const adjustedBottom = bottom + window.scrollY

        if (
          pageY < adjustedTop - verticalBuffer ||
          pageY > adjustedBottom + verticalBuffer ||
          pageX < left - horizontalBuffer ||
          pageX > right + horizontalBuffer
        ) {
          if (hoveredElement !== null) {
            setHoveredElement(null)
          }
          return
        }

        // This is used to allow the _emptyBlockElem to be found when the mouse is in the
        // buffer zone around the scrollerElem.
        if (pageX < left || pageX > right) {
          distanceFromScrollerElem = pageX < left ? pageX - left : pageX - right
        }
      }

      if (isOnHandleElement(target, ADD_BLOCK_MENU_CLASSNAME)) {
        return
      }
      const { blockElem: _emptyBlockElem, blockNode } = getBlockElement(
        anchorElem,
        editor,
        event,
        false,
        -distanceFromScrollerElem,
      )
      if (!_emptyBlockElem) {
        return
      }
      if (hoveredElement?.node !== blockNode || hoveredElement?.elem !== _emptyBlockElem) {
        setHoveredElement({
          elem: _emptyBlockElem,
          node: blockNode,
        })
      }
    }

    // Since the draggableBlockElem is outside the actual editor, we need to listen to the document
    // to be able to detect when the mouse is outside the editor and respect a buffer around
    // the scrollerElem to avoid the draggableBlockElem disappearing too early.
    document?.addEventListener('mousemove', onDocumentMouseMove)

    return () => {
      document?.removeEventListener('mousemove', onDocumentMouseMove)
    }
  }, [scrollerElem, anchorElem, editor, hoveredElement])

  useEffect(() => {
    if (menuRef.current && hoveredElement?.node) {
      editor.getEditorState().read(() => {
        // Check if blockNode is an empty text node
        let isEmptyParagraph = true
        if (
          hoveredElement.node.getType() !== 'paragraph' ||
          hoveredElement.node.getTextContent() !== ''
        ) {
          isEmptyParagraph = false
        }

        setHandlePosition(
          hoveredElement?.elem,
          menuRef.current,
          anchorElem,
          isEmptyParagraph ? SPACE : SPACE - 20,
        )
      })
    }
  }, [anchorElem, hoveredElement, editor])

  const handleAddClick = useCallback(
    (event) => {
      let hoveredElementToUse = hoveredElement
      if (!hoveredElementToUse?.node) {
        return
      }

      // 1. Update hoveredElement.node to a new paragraph node if the hoveredElement.node is not a paragraph node
      editor.update(() => {
        // Check if blockNode is an empty text node
        let isEmptyParagraph = true
        if (
          hoveredElementToUse.node.getType() !== 'paragraph' ||
          hoveredElementToUse.node.getTextContent() !== ''
        ) {
          isEmptyParagraph = false
        }

        if (!isEmptyParagraph) {
          const newParagraph = $createParagraphNode()
          hoveredElementToUse.node.insertAfter(newParagraph)

          setTimeout(() => {
            hoveredElementToUse = {
              elem: editor.getElementByKey(newParagraph.getKey()),
              node: newParagraph,
            }
            setHoveredElement(hoveredElementToUse)
          }, 0)
        }
      })

      // 2. Focus on the new paragraph node
      setTimeout(() => {
        editor.update(() => {
          editor.focus()

          if (
            hoveredElementToUse.node &&
            'select' in hoveredElementToUse.node &&
            typeof hoveredElementToUse.node.select === 'function'
          ) {
            hoveredElementToUse.node.select()
          }
        })
      }, 1)

      // Make sure this is called AFTER the focusing has been processed by the browser
      // Otherwise, this won't work
      setTimeout(() => {
        editor.dispatchCommand(ENABLE_SLASH_MENU_COMMAND, {
          node: hoveredElementToUse.node as ParagraphNode,
        })
      }, 2)

      event.stopPropagation()
      event.preventDefault()
    },
    [editor, hoveredElement],
  )

  return createPortal(
    <React.Fragment>
      <button
        className="icon add-block-menu"
        onClick={(event) => {
          handleAddClick(event)
        }}
        ref={menuRef}
        type="button"
      >
        <div className={isEditable ? 'icon' : ''} />
      </button>
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
