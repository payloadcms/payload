'use client'
import type { LexicalEditor } from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { eventFiles } from '@lexical/rich-text'
import { Popup, PopupList, useTranslation } from '@payloadcms/ui'
import { $getNearestNodeFromDOMNode, $getNodeByKey, isHTMLElement } from 'lexical'
import * as React from 'react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { useEditorConfigContext } from '../../../config/client/EditorConfigProvider.js'
import { Point } from '../../../utils/point.js'
import { calculateDistanceFromScrollerElem } from '../utils/calculateDistanceFromScrollerElem.js'
import { getNodeCloseToPoint } from '../utils/getNodeCloseToPoint.js'
import { getTopLevelNodeKeys } from '../utils/getTopLevelNodeKeys.js'
import { isOnHandleElement } from '../utils/isOnHandleElement.js'
import { setHandlePosition } from '../utils/setHandlePosition.js'
import { getBoundingClientRectWithoutTransform } from './getBoundingRectWithoutTransform.js'
import './index.css'
import { $moveBlock } from './moveBlock.js'
import { setTargetLine } from './setTargetLine.js'
import { useKeyboardReordering } from './useKeyboardReordering.js'

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
    lastTargetBlockElem.style.opacity = ''
    // Delete marginBottom and marginTop values we set
    lastTargetBlockElem.style.marginBottom = ''
    lastTargetBlockElem.style.marginTop = ''
    //lastTargetBlock.style.border = 'none'
  }
}

function useDraggableBlockMenu(
  editor: LexicalEditor,
  anchorElem: HTMLElement,
  isEditable: boolean,
): React.ReactElement {
  const scrollerElem = anchorElem.parentElement
  const instructionsID = useId()
  const { t } = useTranslation()

  useKeyboardReordering({ editor, instructionsID })

  const menuRef = useRef<HTMLDivElement>(null)
  const isMenuOpenRef = useRef(false)
  const targetLineRef = useRef<HTMLDivElement>(null)
  const debugHighlightRef = useRef<HTMLDivElement>(null)
  const isDraggingBlockRef = useRef<boolean>(false)
  const highlightTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const [draggableBlockElem, setDraggableBlockElem] = useState<HTMLElement | null>(null)
  const [lastTargetBlock, setLastTargetBlock] = useState<{
    boundingBox?: DOMRect
    elem: HTMLElement | null
    isBelow: boolean
  } | null>(null)

  const { editorConfig } = useEditorConfigContext()

  const blockHandleHorizontalOffset = editorConfig?.admin?.hideGutter ? -44 : -8

  useEffect(() => {
    /**
     * Handles positioning of the drag handle
     */
    function onDocumentMouseMove(event: MouseEvent) {
      const target = event.target
      if (isMenuOpenRef.current || !isHTMLElement(target)) {
        return
      }

      const distanceFromScrollerElem = calculateDistanceFromScrollerElem(
        scrollerElem,
        event.pageX,
        event.pageY,
        target,
      )
      if (distanceFromScrollerElem === -1) {
        setDraggableBlockElem(null)
        return
      }

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
        cache_threshold: 0,
        editor,
        horizontalOffset: -distanceFromScrollerElem,
        point: new Point(event.x, event.y),
        startIndex: getCurrentIndex(topLevelNodeKeys.length),
        useEdgeAsDefault: false,
        verbose: false,
      })

      prevIndex = foundAtIndex

      //if (DEBUG && _draggableBlockElem) {
      //targetBlockElem.style.border = '3px solid red'
      // highlightElemOriginalPosition(debugHighlightRef, _draggableBlockElem, anchorElem)
      //}

      if (!_draggableBlockElem && !isFoundNodeEmptyParagraph) {
        return
      }

      if (draggableBlockElem !== _draggableBlockElem) {
        setDraggableBlockElem(_draggableBlockElem)
      }
    }

    // Since the draggableBlockElem is outside the actual editor, we need to listen to the document
    // to be able to detect when the mouse is outside the editor and respect a buffer around
    // the scrollerElem to avoid the draggableBlockElem disappearing too early.
    const onDocumentPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || event.pointerType === 'pen') {
        onDocumentMouseMove(event)
      }
    }

    document?.addEventListener('mousemove', onDocumentMouseMove)
    document?.addEventListener('pointerdown', onDocumentPointerDown)

    return () => {
      document?.removeEventListener('mousemove', onDocumentMouseMove)
      document?.removeEventListener('pointerdown', onDocumentPointerDown)
    }
  }, [scrollerElem, anchorElem, editor, draggableBlockElem])

  useEffect(() => {
    if (menuRef.current) {
      setHandlePosition(
        draggableBlockElem,
        menuRef.current,
        anchorElem,
        blockHandleHorizontalOffset,
      )
    }
  }, [anchorElem, draggableBlockElem, blockHandleHorizontalOffset])

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
        scrollerElem,
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

      // Always prevent default and set dropEffect during drag to maintain the move cursor
      event.preventDefault()
      event.dataTransfer!.dropEffect = 'move'

      if (draggableBlockElem !== targetBlockElem) {
        const { isBelow, willStayInSamePosition } = setTargetLine(
          editorConfig?.admin?.hideGutter ? '0px' : 'var(--spacer-5)',
          blockHandleHorizontalOffset +
            (editorConfig?.admin?.hideGutter
              ? (menuRef?.current?.getBoundingClientRect()?.width ?? 0)
              : -(menuRef?.current?.getBoundingClientRect()?.width ?? 0)),
          targetLineElem,
          targetBlockElem,
          lastTargetBlock!,
          pageY,
          anchorElem,
          event,
          debugHighlightRef,
          isFoundNodeEmptyParagraph,
        )

        if (!willStayInSamePosition) {
          setLastTargetBlock({
            boundingBox: targetBlockElem.getBoundingClientRect(),
            elem: targetBlockElem,
            isBelow,
          })
        }
      } else if (lastTargetBlock?.elem) {
        hideTargetLine(targetLineElem, lastTargetBlock.elem)
        setLastTargetBlock({
          boundingBox: targetBlockElem.getBoundingClientRect(),
          elem: targetBlockElem,
          isBelow: false,
        })
      }

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
          scrollerElem,
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

        // find all previous elements with lexical-block-highlighter class and remove them
        const allPrevHighlighters = document.querySelectorAll('.lexical-block-highlighter')
        allPrevHighlighters.forEach((highlighter) => {
          highlighter.remove()
        })

        const newInsertedElem = editor.getElementByKey(draggedNode.getKey())
        const highlightTimer = setTimeout(() => {
          // add new temp html element to newInsertedElem with the same height and width and the class block-selected
          // to highlight the new inserted element
          const newInsertedElemRect = newInsertedElem?.getBoundingClientRect()
          if (!newInsertedElemRect) {
            return
          }
          const highlightElem = document.createElement('div')
          highlightElem.className = 'lexical-block-highlighter'

          highlightElem.style.backgroundColor = 'var(--color-bg-inverse)'
          highlightElem.style.transition = 'opacity 0.5s ease-in-out'
          highlightElem.style.zIndex = '1'
          highlightElem.style.pointerEvents = 'none'
          highlightElem.style.boxSizing = 'border-box'
          highlightElem.style.borderRadius = '4px'
          highlightElem.style.position = 'absolute'
          document.body.appendChild(highlightElem)

          highlightElem.style.opacity = '0.1'

          highlightElem.style.height = `${newInsertedElemRect.height + 8}px`
          highlightElem.style.width = `${newInsertedElemRect.width + 8}px`
          highlightElem.style.top = `${newInsertedElemRect.top + window.scrollY - 4}px`
          highlightElem.style.left = `${newInsertedElemRect.left - 4}px`

          const fadeTimer = setTimeout(() => {
            highlightElem.style.opacity = '0'
            const removeTimer = setTimeout(() => {
              highlightElem.remove()
            }, 500)
            highlightTimersRef.current.push(removeTimer)
          }, 1000)
          highlightTimersRef.current.push(fadeTimer)
        }, 120)
        highlightTimersRef.current.push(highlightTimer)
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
      highlightTimersRef.current.forEach(clearTimeout)
      highlightTimersRef.current = []
    }
  }, [
    scrollerElem,
    blockHandleHorizontalOffset,
    anchorElem,
    editor,
    lastTargetBlock,
    draggableBlockElem,
    editorConfig?.admin?.hideGutter,
  ])

  const startDrag = useCallback(
    ({
      blockElem,
      dataTransfer,
    }: {
      blockElem: HTMLElement | null
      dataTransfer: DataTransfer | null
    }) => {
      if (!editor.isEditable() || !dataTransfer || !blockElem) {
        return
      }

      setDragImage(dataTransfer, blockElem)
      dataTransfer.effectAllowed = 'move'
      editor.read(() => {
        const node = $getNearestNodeFromDOMNode(blockElem)?.getTopLevelElement()

        if (node) {
          isDraggingBlockRef.current = true
          dataTransfer.setData(DRAG_DATA_FORMAT, node.getKey())
        }
      })
    },
    [editor],
  )

  const onDragEnd = useCallback(() => {
    isDraggingBlockRef.current = false
    if (lastTargetBlock?.elem) {
      hideTargetLine(targetLineRef.current, lastTargetBlock.elem)
    }
  }, [lastTargetBlock])

  useEffect(() => {
    const onHeaderDragStart = (event: DragEvent) => {
      const handle =
        event.target instanceof HTMLElement
          ? event.target.closest<HTMLElement>('.collapsible__drag[draggable="true"]')
          : null

      if (!handle || !editor.getRootElement()?.contains(handle)) {
        return
      }

      const blockElem = editor.getElementByKey(handle.dataset.sortableId ?? '')

      if (blockElem) {
        setDraggableBlockElem(blockElem)
        startDrag({ blockElem, dataTransfer: event.dataTransfer })
      }
    }

    document.addEventListener('dragstart', onHeaderDragStart)
    document.addEventListener('dragend', onDragEnd)
    return () => {
      document.removeEventListener('dragstart', onHeaderDragStart)
      document.removeEventListener('dragend', onDragEnd)
    }
  }, [editor, startDrag, onDragEnd])

  function moveBlock({ direction }: { direction: -1 | 1 }) {
    if (!editor.isEditable() || !draggableBlockElem) {
      return
    }

    editor.update(
      () => {
        const node = $getNearestNodeFromDOMNode(draggableBlockElem)?.getTopLevelElement()

        if (node) {
          $moveBlock({ direction, node })
        }
      },
      {
        onUpdate: () => {
          if (menuRef.current) {
            setHandlePosition(
              draggableBlockElem,
              menuRef.current,
              anchorElem,
              blockHandleHorizontalOffset,
            )
          }
        },
      },
    )
  }

  return createPortal(
    <React.Fragment>
      <span className="sr-only" id={instructionsID}>
        {t('general:moveUp')}: Alt + Shift + ↑. {t('general:moveDown')}: Alt + Shift + ↓.
      </span>
      <div className="draggable-block-menu" ref={menuRef}>
        <Popup
          caret={false}
          disabled={!isEditable}
          onToggleClose={() => {
            isMenuOpenRef.current = false
          }}
          onToggleOpen={() => {
            isMenuOpenRef.current = true
          }}
          popupType="menu"
          render={({ close }) => (
            <PopupList.ButtonGroup>
              {([-1, 1] as const).map((direction) => (
                <PopupList.Button
                  key={direction}
                  onClick={() => {
                    moveBlock({ direction })
                    close()
                  }}
                >
                  {t(direction === -1 ? 'general:moveUp' : 'general:moveDown')}
                </PopupList.Button>
              ))}
            </PopupList.ButtonGroup>
          )}
          renderButton={({ active: _active, ...buttonProps }) => (
            <button
              {...buttonProps}
              aria-label={t('general:dragToMove')}
              className="draggable-block-menu__button"
              disabled={!isEditable}
              draggable={isEditable}
              onDragEnd={onDragEnd}
              onDragStart={(event) =>
                startDrag({ blockElem: draggableBlockElem, dataTransfer: event.dataTransfer })
              }
              type="button"
            >
              <div className={isEditable ? 'icon' : ''} />
            </button>
          )}
        />
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
}): React.ReactElement {
  const [editor] = useLexicalComposerContext()
  return useDraggableBlockMenu(editor, anchorElem, editor._editable)
}
