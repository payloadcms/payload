/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TableCellNode, TableRowNode } from '@lexical/table'
import type { EditorConfig, NodeKey } from 'lexical'
import type { JSX } from 'react'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getTableColumnIndexFromTableCellNode,
  $getTableRowIndexFromTableCellNode,
  $insertTableColumn__EXPERIMENTAL,
  $insertTableRow__EXPERIMENTAL,
  $isTableCellNode,
  $isTableNode,
  TableNode,
} from '@lexical/table'
import { $findMatchingParent, mergeRegister } from '@lexical/utils'
import { $getNearestNodeFromDOMNode } from 'lexical'
import { useEffect, useRef, useState } from 'react'
import * as React from 'react'
import { createPortal } from 'react-dom'

import { useEditorConfigContext } from '../../../../../lexical/config/client/EditorConfigProvider.js'
import { useDebounce } from '../../utils/useDebounce.js'

const BUTTON_WIDTH_PX = 20

function TableHoverActionsContainer({ anchorElem }: { anchorElem: HTMLElement }): JSX.Element {
  const [editor] = useLexicalComposerContext()
  const editorConfig = useEditorConfigContext()
  const [isShownRow, setShownRow] = useState<boolean>(false)
  const [isShownColumn, setShownColumn] = useState<boolean>(false)
  const [shouldListenMouseMove, setShouldListenMouseMove] = useState<boolean>(false)
  const [position, setPosition] = useState({})
  const codeSetRef = useRef<Set<NodeKey>>(new Set())
  const tableDOMNodeRef = useRef<HTMLElement | null>(null)

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

      tableDOMNodeRef.current = tableDOMNode

      let hoveredRowNode: TableCellNode | null = null
      let hoveredColumnNode: TableCellNode | null = null
      let tableDOMElement: HTMLElement | null = null

      editor.update(() => {
        const maybeTableCell = $getNearestNodeFromDOMNode(tableDOMNode)

        if ($isTableCellNode(maybeTableCell)) {
          const table = $findMatchingParent(maybeTableCell, (node) => $isTableNode(node))
          if (!$isTableNode(table)) {
            return
          }

          tableDOMElement = editor.getElementByKey(table?.getKey())

          if (tableDOMElement) {
            const rowCount = table.getChildrenSize()
            const colCount =
              // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
              ((table as TableNode).getChildAtIndex(0) as TableRowNode)?.getChildrenSize()

            const rowIndex = $getTableRowIndexFromTableCellNode(maybeTableCell)
            const colIndex = $getTableColumnIndexFromTableCellNode(maybeTableCell)

            if (rowIndex === rowCount - 1) {
              hoveredRowNode = maybeTableCell
            } else if (colIndex === colCount - 1) {
              hoveredColumnNode = maybeTableCell
            }
          }
        }
      })

      if (tableDOMElement) {
        const {
          bottom: tableElemBottom,
          height: tableElemHeight,
          right: tableElemRight,
          width: tableElemWidth,
          x: tableElemX,
          y: tableElemY,
        } = (tableDOMElement as HTMLTableElement).getBoundingClientRect()

        const { left: editorElemLeft, y: editorElemY } = anchorElem.getBoundingClientRect()

        if (hoveredRowNode) {
          setShownColumn(false)
          setShownRow(true)
          setPosition({
            height: BUTTON_WIDTH_PX,
            left: tableElemX - editorElemLeft,
            top: tableElemBottom - editorElemY + 5,
            width: tableElemWidth,
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
      }
    },
    50,
    250,
  )

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
          editor.getEditorState().read(() => {
            for (const [key, type] of mutations) {
              switch (type) {
                case 'created':
                  codeSetRef.current.add(key)
                  setShouldListenMouseMove(codeSetRef.current.size > 0)
                  break

                case 'destroyed':
                  codeSetRef.current.delete(key)
                  setShouldListenMouseMove(codeSetRef.current.size > 0)
                  break

                default:
                  break
              }
            }
          })
        },
        { skipInitialization: false },
      ),
    )
  }, [editor])

  const insertAction = (insertRow: boolean) => {
    editor.update(() => {
      if (tableDOMNodeRef.current) {
        const maybeTableNode = $getNearestNodeFromDOMNode(tableDOMNodeRef.current)
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

  return (
    <>
      {isShownRow && (
        <button
          className={editorConfig.editorConfig.lexical.theme.tableAddRows}
          onClick={() => insertAction(true)}
          style={{ ...position }}
        />
      )}
      {isShownColumn && (
        <button
          className={editorConfig.editorConfig.lexical.theme.tableAddColumns}
          onClick={() => insertAction(false)}
          style={{ ...position }}
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

  if (target && target instanceof HTMLElement) {
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
}): React.ReactPortal | null {
  return createPortal(<TableHoverActionsContainer anchorElem={anchorElem} />, anchorElem)
}
