'use client'

import type { TableCellNode, TableDOMCell, TableMapType } from '@lexical/table'
import type { LexicalEditor } from 'lexical'
import type { JSX, MouseEventHandler } from 'react'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useLexicalEditable } from '@lexical/react/useLexicalEditable'
import {
  $computeTableMapSkipCellCheck,
  $getTableNodeFromLexicalNodeOrThrow,
  $getTableRowIndexFromTableCellNode,
  $isTableCellNode,
  $isTableRowNode,
  getDOMCellFromTarget,
  getTableElement,
  TableNode,
} from '@lexical/table'
import { calculateZoomLevel } from '@lexical/utils'
import { $getNearestNodeFromDOMNode } from 'lexical'
import * as React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import type { PluginComponent } from '../../../../typesClient.js'

import { useEditorConfigContext } from '../../../../../lexical/config/client/EditorConfigProvider.js'

type MousePosition = {
  x: number
  y: number
}

type MouseDraggingDirection = 'bottom' | 'right'

const MIN_ROW_HEIGHT = 33
const MIN_COLUMN_WIDTH = 92

function TableCellResizer({ editor }: { editor: LexicalEditor }): JSX.Element {
  const targetRef = useRef<HTMLElement | null>(null)
  const resizerRef = useRef<HTMLDivElement | null>(null)
  const tableRectRef = useRef<ClientRect | null>(null)
  const editorConfig = useEditorConfigContext()

  const mouseStartPosRef = useRef<MousePosition | null>(null)
  const [mouseCurrentPos, updateMouseCurrentPos] = useState<MousePosition | null>(null)

  const [activeCell, updateActiveCell] = useState<null | TableDOMCell>(null)
  const [isMouseDown, updateIsMouseDown] = useState<boolean>(false)
  const [draggingDirection, updateDraggingDirection] = useState<MouseDraggingDirection | null>(null)

  const resetState = useCallback(() => {
    updateActiveCell(null)
    targetRef.current = null
    updateDraggingDirection(null)
    mouseStartPosRef.current = null
    tableRectRef.current = null
  }, [])

  const isMouseDownOnEvent = (event: MouseEvent) => {
    return (event.buttons & 1) === 1
  }

  useEffect(() => {
    return editor.registerNodeTransform(TableNode, (tableNode) => {
      if (tableNode.getColWidths()) {
        return tableNode
      }

      const numColumns = tableNode.getColumnCount()
      const columnWidth = MIN_COLUMN_WIDTH

      tableNode.setColWidths(Array(numColumns).fill(columnWidth))
      return tableNode
    })
  }, [editor])

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      const target = event.target

      if (draggingDirection) {
        updateMouseCurrentPos({
          x: event.clientX,
          y: event.clientY,
        })
        return
      }
      updateIsMouseDown(isMouseDownOnEvent(event))
      if (resizerRef.current && resizerRef.current.contains(target as Node)) {
        return
      }

      if (targetRef.current !== target) {
        targetRef.current = target as HTMLElement
        const cell = getDOMCellFromTarget(target as HTMLElement)

        if (cell && activeCell !== cell) {
          editor.getEditorState().read(
            () => {
              const tableCellNode = $getNearestNodeFromDOMNode(cell.elem)

              if (!tableCellNode) {
                throw new Error('TableCellResizer: Table cell node not found.')
              }

              const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode)
              const tableElement = getTableElement(
                tableNode,
                editor.getElementByKey(tableNode.getKey()),
              )
              if (!tableElement) {
                throw new Error('TableCellResizer: Table element not found.')
              }

              targetRef.current = target as HTMLElement
              tableRectRef.current = tableElement.getBoundingClientRect()
              updateActiveCell(cell)
            },
            { editor },
          )
        } else if (cell == null) {
          resetState()
        }
      }
    }

    const onMouseDown = (event: MouseEvent) => {
      updateIsMouseDown(true)
    }

    const onMouseUp = (event: MouseEvent) => {
      updateIsMouseDown(false)
    }

    const removeRootListener = editor.registerRootListener((rootElement, prevRootElement) => {
      prevRootElement?.removeEventListener('mousemove', onMouseMove)
      prevRootElement?.removeEventListener('mousedown', onMouseDown)
      prevRootElement?.removeEventListener('mouseup', onMouseUp)
      rootElement?.addEventListener('mousemove', onMouseMove)
      rootElement?.addEventListener('mousedown', onMouseDown)
      rootElement?.addEventListener('mouseup', onMouseUp)
    })

    return () => {
      removeRootListener()
    }
  }, [activeCell, draggingDirection, editor, resetState])

  const isHeightChanging = (direction: MouseDraggingDirection) => {
    if (direction === 'bottom') {
      return true
    }
    return false
  }

  const updateRowHeight = useCallback(
    (heightChange: number) => {
      if (!activeCell) {
        throw new Error('TableCellResizer: Expected active cell.')
      }

      editor.update(
        () => {
          const tableCellNode = $getNearestNodeFromDOMNode(activeCell.elem)
          if (!$isTableCellNode(tableCellNode)) {
            throw new Error('TableCellResizer: Table cell node not found.')
          }

          const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode)

          const tableRowIndex =
            $getTableRowIndexFromTableCellNode(tableCellNode) + tableCellNode.getRowSpan() - 1

          const tableRows = tableNode.getChildren()

          if (tableRowIndex >= tableRows.length || tableRowIndex < 0) {
            throw new Error('Expected table cell to be inside of table row.')
          }

          const tableRow = tableRows[tableRowIndex]

          if (!$isTableRowNode(tableRow)) {
            throw new Error('Expected table row')
          }

          let height = tableRow.getHeight()
          if (height === undefined) {
            const rowCells = tableRow.getChildren<TableCellNode>()
            height = Math.min(
              ...rowCells.map((cell) => getCellNodeHeight(cell, editor) ?? Infinity),
            )
          }

          const newHeight = Math.max(height + heightChange, MIN_ROW_HEIGHT)
          tableRow.setHeight(newHeight)
        },
        { tag: 'skip-scroll-into-view' },
      )
    },
    [activeCell, editor],
  )

  const getCellNodeHeight = (
    cell: TableCellNode,
    activeEditor: LexicalEditor,
  ): number | undefined => {
    const domCellNode = activeEditor.getElementByKey(cell.getKey())
    return domCellNode?.clientHeight
  }

  const getCellColumnIndex = (tableCellNode: TableCellNode, tableMap: TableMapType) => {
    for (let row = 0; row < tableMap.length; row++) {
      for (let column = 0; column < tableMap[row].length; column++) {
        if (tableMap[row][column].cell === tableCellNode) {
          return column
        }
      }
    }
  }

  const updateColumnWidth = useCallback(
    (widthChange: number) => {
      if (!activeCell) {
        throw new Error('TableCellResizer: Expected active cell.')
      }
      editor.update(
        () => {
          const tableCellNode = $getNearestNodeFromDOMNode(activeCell.elem)
          if (!$isTableCellNode(tableCellNode)) {
            throw new Error('TableCellResizer: Table cell node not found.')
          }

          const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode)
          const [tableMap] = $computeTableMapSkipCellCheck(tableNode, null, null)
          const columnIndex = getCellColumnIndex(tableCellNode, tableMap)
          if (columnIndex === undefined) {
            throw new Error('TableCellResizer: Table column not found.')
          }

          const colWidths = tableNode.getColWidths()
          if (!colWidths) {
            return
          }
          const width = colWidths[columnIndex]
          if (width === undefined) {
            return
          }
          const newColWidths = [...colWidths]
          const newWidth = Math.max(width + widthChange, MIN_COLUMN_WIDTH)
          newColWidths[columnIndex] = newWidth
          tableNode.setColWidths(newColWidths)
        },
        { tag: 'skip-scroll-into-view' },
      )
    },
    [activeCell, editor],
  )

  const mouseUpHandler = useCallback(
    (direction: MouseDraggingDirection) => {
      const handler = (event: MouseEvent) => {
        event.preventDefault()
        event.stopPropagation()

        if (!activeCell) {
          throw new Error('TableCellResizer: Expected active cell.')
        }

        if (mouseStartPosRef.current) {
          const { x, y } = mouseStartPosRef.current

          if (activeCell === null) {
            return
          }
          const zoom = calculateZoomLevel(event.target as Element)

          if (isHeightChanging(direction)) {
            const heightChange = (event.clientY - y) / zoom
            updateRowHeight(heightChange)
          } else {
            const widthChange = (event.clientX - x) / zoom
            updateColumnWidth(widthChange)
          }

          resetState()
          document.removeEventListener('mouseup', handler)
        }
      }
      return handler
    },
    [activeCell, resetState, updateColumnWidth, updateRowHeight],
  )

  const toggleResize = useCallback(
    (direction: MouseDraggingDirection): MouseEventHandler<HTMLDivElement> =>
      (event) => {
        event.preventDefault()
        event.stopPropagation()

        if (!activeCell) {
          throw new Error('TableCellResizer: Expected active cell.')
        }

        mouseStartPosRef.current = {
          x: event.clientX,
          y: event.clientY,
        }
        updateMouseCurrentPos(mouseStartPosRef.current)
        updateDraggingDirection(direction)

        document.addEventListener('mouseup', mouseUpHandler(direction))
      },
    [activeCell, mouseUpHandler],
  )

  const [resizerStyles, setResizerStyles] = useState<{
    bottom?: null | React.CSSProperties
    left?: null | React.CSSProperties
    right?: null | React.CSSProperties
    top?: null | React.CSSProperties
  }>({
    bottom: null,
    left: null,
    right: null,
    top: null,
  })

  useEffect(() => {
    if (activeCell) {
      const { height, left, top, width } = activeCell.elem.getBoundingClientRect()
      const zoom = calculateZoomLevel(activeCell.elem)
      const zoneWidth = 10 // Pixel width of the zone where you can drag the edge
      const styles = {
        bottom: {
          backgroundColor: 'none',
          cursor: 'row-resize',
          height: `${zoneWidth}px`,
          left: `${window.scrollX + left}px`,
          top: `${window.scrollY + top + height - zoneWidth / 2}px`,
          width: `${width}px`,
        },
        right: {
          backgroundColor: 'none',
          cursor: 'col-resize',
          height: `${height}px`,
          left: `${window.scrollX + left + width - zoneWidth / 2}px`,
          top: `${window.scrollY + top}px`,
          width: `${zoneWidth}px`,
        },
      }

      const tableRect = tableRectRef.current

      if (draggingDirection && mouseCurrentPos && tableRect) {
        if (isHeightChanging(draggingDirection)) {
          styles[draggingDirection].left = `${window.scrollX + tableRect.left}px`
          styles[draggingDirection].top = `${window.scrollY + mouseCurrentPos.y / zoom}px`
          styles[draggingDirection].height = '3px'
          styles[draggingDirection].width = `${tableRect.width}px`
        } else {
          styles[draggingDirection].top = `${window.scrollY + tableRect.top}px`
          styles[draggingDirection].left = `${window.scrollX + mouseCurrentPos.x / zoom}px`
          styles[draggingDirection].width = '3px'
          styles[draggingDirection].height = `${tableRect.height}px`
        }

        styles[draggingDirection].backgroundColor = '#adf'
      }

      setResizerStyles(styles)
    } else {
      setResizerStyles({
        bottom: null,
        left: null,
        right: null,
        top: null,
      })
    }
  }, [activeCell, draggingDirection, mouseCurrentPos])

  return (
    <div ref={resizerRef}>
      {activeCell != null && !isMouseDown && (
        <React.Fragment>
          <div
            className={`${editorConfig.editorConfig.lexical.theme.tableCellResizer} TableCellResizer__ui`}
            onMouseDown={toggleResize('right')}
            style={resizerStyles.right || undefined}
          />
          <div
            className={`${editorConfig.editorConfig.lexical.theme.tableCellResizer} TableCellResizer__ui`}
            onMouseDown={toggleResize('bottom')}
            style={resizerStyles.bottom || undefined}
          />
        </React.Fragment>
      )}
    </div>
  )
}

export const TableCellResizerPlugin: PluginComponent = () => {
  const [editor] = useLexicalComposerContext()
  const isEditable = useLexicalEditable()

  return useMemo(
    () => (isEditable ? createPortal(<TableCellResizer editor={editor} />, document.body) : null),
    [editor, isEditable],
  )
}
