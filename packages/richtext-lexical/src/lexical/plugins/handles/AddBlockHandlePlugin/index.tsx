'use client'
import type { LexicalEditor, LexicalNode, ParagraphNode } from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { $createParagraphNode, isHTMLElement } from 'lexical'
import * as React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { useEditorConfigContext } from '../../../config/client/EditorConfigProvider.js'
import { Point } from '../../../utils/point.js'
import { ENABLE_SLASH_MENU_COMMAND } from '../../SlashMenu/LexicalTypeaheadMenuPlugin/index.js'
import { calculateDistanceFromScrollerElem } from '../utils/calculateDistanceFromScrollerElem.js'
import { getNodeCloseToPoint } from '../utils/getNodeCloseToPoint.js'
import { getTopLevelNodeKeys } from '../utils/getTopLevelNodeKeys.js'
import { isOnHandleElement } from '../utils/isOnHandleElement.js'
import { setHandlePosition } from '../utils/setHandlePosition.js'
import './index.scss'

const ADD_BLOCK_MENU_CLASSNAME = 'add-block-menu'

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

function useAddBlockHandle(
  editor: LexicalEditor,
  anchorElem: HTMLElement,
  isEditable: boolean,
): React.ReactElement {
  const scrollerElem = anchorElem.parentElement

  const { editorConfig } = useEditorConfigContext()
  const blockHandleHorizontalOffset = editorConfig?.admin?.hideGutter ? -24 : 12

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

      const distanceFromScrollerElem = calculateDistanceFromScrollerElem(
        scrollerElem,
        event.pageX,
        event.pageY,
        target,
      )

      if (distanceFromScrollerElem === -1) {
        setHoveredElement(null)
        return
      }

      if (isOnHandleElement(target, ADD_BLOCK_MENU_CLASSNAME)) {
        return
      }
      const topLevelNodeKeys = getTopLevelNodeKeys(editor)

      const {
        blockElem: _emptyBlockElem,
        blockNode,
        foundAtIndex,
      } = getNodeCloseToPoint({
        anchorElem,
        cache_threshold: 0,
        editor,
        horizontalOffset: -distanceFromScrollerElem,
        point: new Point(event.x, event.y),
        returnEmptyParagraphs: true,
        startIndex: getCurrentIndex(topLevelNodeKeys.length),
        useEdgeAsDefault: false,
      })

      prevIndex = foundAtIndex

      if (!_emptyBlockElem) {
        return
      }
      if (
        blockNode &&
        (hoveredElement?.node !== blockNode || hoveredElement?.elem !== _emptyBlockElem)
      ) {
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
      setHandlePosition(
        hoveredElement?.elem,
        menuRef.current,
        anchorElem,
        blockHandleHorizontalOffset,
      )
    }
  }, [anchorElem, hoveredElement, blockHandleHorizontalOffset])

  const handleAddClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      let hoveredElementToUse = hoveredElement
      if (!hoveredElementToUse?.node) {
        return
      }

      // 1. Update hoveredElement.node to a new paragraph node if the hoveredElement.node is not a paragraph node
      editor.update(() => {
        // Check if blockNode is an empty text node
        let isEmptyParagraph = true
        if (
          hoveredElementToUse?.node.getType() !== 'paragraph' ||
          hoveredElementToUse.node.getTextContent() !== ''
        ) {
          isEmptyParagraph = false
        }

        if (!isEmptyParagraph) {
          const newParagraph = $createParagraphNode()
          hoveredElementToUse?.node.insertAfter(newParagraph)

          setTimeout(() => {
            hoveredElementToUse = {
              elem: editor.getElementByKey(newParagraph.getKey())!,
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
            hoveredElementToUse?.node &&
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
          node: hoveredElementToUse?.node as ParagraphNode,
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
        aria-label="Add block"
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
}): React.ReactElement {
  const [editor] = useLexicalComposerContext()
  return useAddBlockHandle(editor, anchorElem, editor._editable)
}
