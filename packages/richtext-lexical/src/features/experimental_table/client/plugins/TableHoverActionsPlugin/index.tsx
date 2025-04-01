'use client'

import type { TableCellNode, TableRowNode } from '@lexical/table'
import type { EditorConfig, NodeKey } from 'lexical'
import type { JSX } from 'react'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getTableAndElementByKey,
  $getTableColumnIndexFromTableCellNode,
  $getTableRowIndexFromTableCellNode,
  $insertTableColumn__EXPERIMENTAL,
  $insertTableRow__EXPERIMENTAL,
  $isTableCellNode,
  $isTableNode,
  getTableElement,
  TableNode,
} from '@lexical/table'
import { $findMatchingParent, mergeRegister } from '@lexical/utils'
import { $getNearestNodeFromDOMNode, isHTMLElement } from 'lexical'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as React from 'react'
import { createPortal } from 'react-dom'

import { useEditorConfigContext } from '../../../../../lexical/config/client/EditorConfigProvider.js'
import { useDebounce } from '../../utils/useDebounce.js'

const BUTTON_WIDTH_PX = 20

function TableHoverActionsContainer({
  anchorElem,
}: {
  anchorElem: HTMLElement
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext()
  const editorConfig = useEditorConfigContext()
  const [isShownRow, setShownRow] = useState<boolean>(false)
  const [isShownColumn, setShownColumn] = useState<boolean>(false)
  const [shouldListenMouseMove, setShouldListenMouseMove] = useState<boolean>(false)
  const [position, setPosition] = useState({})
  const tableSetRef = useRef<Set<NodeKey>>(new Set())
  const tableCellDOMNodeRef = useRef<HTMLElement | null>(null)

  const debouncedOnMouseMove = useDebounce(
    (event: MouseEvent) => {
      const { isOutside, tableDOMNode } = getMouseInfo(event, editorConfig.editorConfig?.lexical)

      if (isOutside) {
        setShownRow(false)
        setShownColumn(false)
        return
      }

      if (!tableDOMNode) {
        return
      }

      tableCellDOMNodeRef.current = tableDOMNode

      let hoveredRowNode: null | TableCellNode = null
      let hoveredColumnNode: null | TableCellNode = null
      let tableDOMElement: HTMLElement | null = null

      editor.getEditorState().read(
        () => {
          const maybeTableCell = $getNearestNodeFromDOMNode(tableDOMNode)

          if ($isTableCellNode(maybeTableCell)) {
            const table = $findMatchingParent(maybeTableCell, (node) => $isTableNode(node))
            if (!$isTableNode(table)) {
              return
            }

            tableDOMElement = getTableElement(table, editor.getElementByKey(table.getKey()))

            if (tableDOMElement) {
              const rowCount = table.getChildrenSize()
              const colCount = (table.getChildAtIndex(0) as TableRowNode)?.getChildrenSize()

              const rowIndex = $getTableRowIndexFromTableCellNode(maybeTableCell)
              const colIndex = $getTableColumnIndexFromTableCellNode(maybeTableCell)

              if (rowIndex === rowCount - 1) {
                hoveredRowNode = maybeTableCell
              } else if (colIndex === colCount - 1) {
                hoveredColumnNode = maybeTableCell
              }
            }
          }
        },
        { editor },
      )

      if (!tableDOMElement) {
        return
      }

      // this is the scrollable div container of the table (in case of overflow)
      const tableContainerElement = (tableDOMElement as HTMLTableElement).parentElement

      if (!tableContainerElement) {
        return
      }

      const {
        bottom: tableElemBottom,
        height: tableElemHeight,
        left: tableElemLeft,
        right: tableElemRight,
        width: tableElemWidth,
        y: tableElemY,
      } = (tableDOMElement as HTMLTableElement).getBoundingClientRect()

      let tableHasScroll = false
      if (
        tableContainerElement &&
        tableContainerElement.classList.contains('LexicalEditorTheme__tableScrollableWrapper')
      ) {
        tableHasScroll = tableContainerElement.scrollWidth > tableContainerElement.clientWidth
      }

      const { left: editorElemLeft, y: editorElemY } = anchorElem.getBoundingClientRect()

      if (hoveredRowNode) {
        setShownColumn(false)
        setShownRow(true)
        setPosition({
          height: BUTTON_WIDTH_PX,
          left:
            tableHasScroll && tableContainerElement
              ? tableContainerElement.offsetLeft
              : tableElemLeft - editorElemLeft,
          top: tableElemBottom - editorElemY + 5,
          width:
            tableHasScroll && tableContainerElement
              ? tableContainerElement.offsetWidth
              : tableElemWidth,
        })
      } else if (hoveredColumnNode) {
        setShownColumn(true)
        setShownRow(false)
        setPosition({
          height: tableElemHeight,
          left: tableElemRight - editorElemLeft + 5,
          top: tableElemY - editorElemY,
          width: BUTTON_WIDTH_PX,
        })
      }
    },
    50,
    250,
  )

  // Hide the buttons on any table dimensions change to prevent last row cells
  // overlap behind the 'Add Row' button when text entry changes cell height
  const tableResizeObserver = useMemo(() => {
    return new ResizeObserver(() => {
      setShownRow(false)
      setShownColumn(false)
    })
  }, [])

  useEffect(() => {
    if (!shouldListenMouseMove) {
      return
    }

    document.addEventListener('mousemove', debouncedOnMouseMove)

    return () => {
      setShownRow(false)
      setShownColumn(false)

      document.removeEventListener('mousemove', debouncedOnMouseMove)
    }
  }, [shouldListenMouseMove, debouncedOnMouseMove])

  useEffect(() => {
    return mergeRegister(
      editor.registerMutationListener(
        TableNode,
        (mutations) => {
          editor.getEditorState().read(
            () => {
              let resetObserver = false
              for (const [key, type] of mutations) {
                switch (type) {
                  case 'created': {
                    tableSetRef.current.add(key)
                    resetObserver = true
                    break
                  }
                  case 'destroyed': {
                    tableSetRef.current.delete(key)
                    resetObserver = true
                    break
                  }
                  default:
                    break
                }
              }
              if (resetObserver) {
                // Reset resize observers
                tableResizeObserver.disconnect()
                for (const tableKey of tableSetRef.current) {
                  const { tableElement } = $getTableAndElementByKey(tableKey)
                  tableResizeObserver.observe(tableElement)
                }
                setShouldListenMouseMove(tableSetRef.current.size > 0)
              }
            },
            { editor },
          )
        },
        { skipInitialization: false },
      ),
    )
  }, [editor, tableResizeObserver])

  const insertAction = (insertRow: boolean) => {
    editor.update(() => {
      if (tableCellDOMNodeRef.current) {
        const maybeTableNode = $getNearestNodeFromDOMNode(tableCellDOMNodeRef.current)
        maybeTableNode?.selectEnd()
        if (insertRow) {
          $insertTableRow__EXPERIMENTAL()
          setShownRow(false)
        } else {
          $insertTableColumn__EXPERIMENTAL()
          setShownColumn(false)
        }
      }
    })
  }

  if (!editor?.isEditable()) {
    return null
  }

  return (
    <>
      {isShownRow && (
        <button
          aria-label="Add Row"
          className={editorConfig.editorConfig.lexical.theme.tableAddRows}
          onClick={() => insertAction(true)}
          style={{ ...position }}
          type="button"
        />
      )}
      {isShownColumn && (
        <button
          aria-label="Add Column"
          className={editorConfig.editorConfig.lexical.theme.tableAddColumns}
          onClick={() => insertAction(false)}
          style={{ ...position }}
          type="button"
        />
      )}
    </>
  )
}

function getMouseInfo(
  event: MouseEvent,
  editorConfig: EditorConfig,
): {
  isOutside: boolean
  tableDOMNode: HTMLElement | null
} {
  const target = event.target

  if (isHTMLElement(target)) {
    const tableDOMNode = target.closest<HTMLElement>(
      `td.${editorConfig.theme.tableCell}, th.${editorConfig.theme.tableCell}`,
    )

    const isOutside = !(
      tableDOMNode ||
      target.closest<HTMLElement>(`button.${editorConfig.theme.tableAddRows}`) ||
      target.closest<HTMLElement>(`button.${editorConfig.theme.tableAddColumns}`) ||
      target.closest<HTMLElement>(`div.${editorConfig.theme.tableCellResizer}`)
    )

    return { isOutside, tableDOMNode }
  } else {
    return { isOutside: true, tableDOMNode: null }
  }
}

export function TableHoverActionsPlugin({
  anchorElem = document.body,
}: {
  anchorElem?: HTMLElement
}): null | React.ReactPortal {
  const [editor] = useLexicalComposerContext()
  if (!editor?.isEditable()) {
    return null
  }

  return createPortal(<TableHoverActionsContainer anchorElem={anchorElem} />, anchorElem)
}
