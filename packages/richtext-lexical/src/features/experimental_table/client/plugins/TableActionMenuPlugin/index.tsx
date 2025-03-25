'use client'

import type { TableObserver, TableSelection } from '@lexical/table'
import type { ElementNode } from 'lexical'
import type { JSX } from 'react'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useLexicalEditable } from '@lexical/react/useLexicalEditable'
import {
  $computeTableMapSkipCellCheck,
  $deleteTableColumn__EXPERIMENTAL,
  $deleteTableRow__EXPERIMENTAL,
  $getNodeTriplet,
  $getTableCellNodeFromLexicalNode,
  $getTableColumnIndexFromTableCellNode,
  $getTableNodeFromLexicalNodeOrThrow,
  $getTableRowIndexFromTableCellNode,
  $insertTableColumn__EXPERIMENTAL,
  $insertTableRow__EXPERIMENTAL,
  $isTableCellNode,
  $isTableSelection,
  $unmergeCell,
  getTableElement,
  getTableObserverFromTableElement,
  TableCellHeaderStates,
  TableCellNode,
} from '@lexical/table'
import { mergeRegister } from '@lexical/utils'
import { useScrollInfo } from '@payloadcms/ui'
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isParagraphNode,
  $isRangeSelection,
  $isTextNode,
  $setSelection,
  COMMAND_PRIORITY_CRITICAL,
  getDOMSelection,
  isDOMNode,
  SELECTION_CHANGE_COMMAND,
} from 'lexical'
import * as React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import type { PluginComponentWithAnchor } from '../../../../typesClient.js'

import './index.scss'
import { MeatballsIcon } from '../../../../../lexical/ui/icons/Meatballs/index.js'

function computeSelectionCount(selection: TableSelection): {
  columns: number
  rows: number
} {
  const selectionShape = selection.getShape()
  return {
    columns: selectionShape.toX - selectionShape.fromX + 1,
    rows: selectionShape.toY - selectionShape.fromY + 1,
  }
}

function $canUnmerge(): boolean {
  const selection = $getSelection()
  if (
    ($isRangeSelection(selection) && !selection.isCollapsed()) ||
    ($isTableSelection(selection) && !selection.anchor.is(selection.focus)) ||
    (!$isRangeSelection(selection) && !$isTableSelection(selection))
  ) {
    return false
  }
  const [cell] = $getNodeTriplet(selection.anchor)
  return cell.__colSpan > 1 || cell.__rowSpan > 1
}

function $cellContainsEmptyParagraph(cell: TableCellNode): boolean {
  if (cell.getChildrenSize() !== 1) {
    return false
  }
  const firstChild = cell.getFirstChildOrThrow()
  if (!$isParagraphNode(firstChild) || !firstChild.isEmpty()) {
    return false
  }
  return true
}

function $selectLastDescendant(node: ElementNode): void {
  const lastDescendant = node.getLastDescendant()
  if ($isTextNode(lastDescendant)) {
    lastDescendant.select()
  } else if ($isElementNode(lastDescendant)) {
    lastDescendant.selectEnd()
  } else if (lastDescendant !== null) {
    lastDescendant.selectNext()
  }
}

type TableCellActionMenuProps = Readonly<{
  cellMerge: boolean
  contextRef: { current: HTMLElement | null }
  onClose: () => void
  setIsMenuOpen: (isOpen: boolean) => void
  tableCellNode: TableCellNode
}>

function TableActionMenu({
  cellMerge,
  contextRef,
  onClose,
  setIsMenuOpen,
  tableCellNode: _tableCellNode,
}: TableCellActionMenuProps) {
  const [editor] = useLexicalComposerContext()
  const dropDownRef = useRef<HTMLDivElement | null>(null)
  const [tableCellNode, updateTableCellNode] = useState(_tableCellNode)
  const [selectionCounts, updateSelectionCounts] = useState({
    columns: 1,
    rows: 1,
  })
  const [canMergeCells, setCanMergeCells] = useState(false)
  const [canUnmergeCell, setCanUnmergeCell] = useState(false)
  const { y } = useScrollInfo()

  useEffect(() => {
    return editor.registerMutationListener(
      TableCellNode,
      (nodeMutations) => {
        const nodeUpdated = nodeMutations.get(tableCellNode.getKey()) === 'updated'

        if (nodeUpdated) {
          editor.getEditorState().read(() => {
            updateTableCellNode(tableCellNode.getLatest())
          })
        }
      },
      { skipInitialization: true },
    )
  }, [editor, tableCellNode])

  useEffect(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection()
      // Merge cells
      if ($isTableSelection(selection)) {
        const currentSelectionCounts = computeSelectionCount(selection)
        updateSelectionCounts(computeSelectionCount(selection))

        setCanMergeCells(currentSelectionCounts.columns > 1 || currentSelectionCounts.rows > 1)
      }
      // Unmerge cell
      setCanUnmergeCell($canUnmerge())
    })
  }, [editor])

  useEffect(() => {
    const menuButtonElement = contextRef.current
    const dropDownElement = dropDownRef.current
    const rootElement = editor.getRootElement()

    if (menuButtonElement != null && dropDownElement != null && rootElement != null) {
      const rootEleRect = rootElement.getBoundingClientRect()
      const menuButtonRect = menuButtonElement.getBoundingClientRect()
      dropDownElement.style.opacity = '1'
      const dropDownElementRect = dropDownElement.getBoundingClientRect()
      const margin = 5
      let leftPosition = menuButtonRect.right + margin
      if (
        leftPosition + dropDownElementRect.width > window.innerWidth ||
        leftPosition + dropDownElementRect.width > rootEleRect.right
      ) {
        const position = menuButtonRect.left - dropDownElementRect.width - margin
        leftPosition = (position < 0 ? margin : position) + window.pageXOffset
      }
      dropDownElement.style.left = `${leftPosition + window.pageXOffset}px`

      let topPosition = menuButtonRect.top
      if (topPosition + dropDownElementRect.height > window.innerHeight) {
        const position = menuButtonRect.bottom - dropDownElementRect.height
        topPosition = position < 0 ? margin : position
      }
      dropDownElement.style.top = `${topPosition}px`
    }
  }, [contextRef, dropDownRef, editor, y])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropDownRef.current != null &&
        contextRef.current != null &&
        isDOMNode(event.target) &&
        !dropDownRef.current.contains(event.target) &&
        !contextRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false)
      }
    }

    window.addEventListener('click', handleClickOutside)

    return () => window.removeEventListener('click', handleClickOutside)
  }, [setIsMenuOpen, contextRef])

  const clearTableSelection = useCallback(() => {
    editor.update(() => {
      if (tableCellNode.isAttached()) {
        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode)
        const tableElement = getTableElement(tableNode, editor.getElementByKey(tableNode.getKey()))

        if (tableElement === null) {
          throw new Error('Expected to find tableElement in DOM')
        }

        const tableObserver = getTableObserverFromTableElement(tableElement)
        if (tableObserver !== null) {
          tableObserver.$clearHighlight()
        }

        tableNode.markDirty()
        updateTableCellNode(tableCellNode.getLatest())
      }

      $setSelection(null)
    })
  }, [editor, tableCellNode])

  const mergeTableCellsAtSelection = () => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isTableSelection(selection)) {
        // Get all selected cells and compute the total area
        const nodes = selection.getNodes()
        const tableCells = nodes.filter($isTableCellNode)

        if (tableCells.length === 0) {
          return
        }

        // Find the table node
        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCells[0] as TableCellNode)
        const [gridMap] = $computeTableMapSkipCellCheck(tableNode, null, null)

        // Find the boundaries of the selection including merged cells
        let minRow = Infinity
        let maxRow = -Infinity
        let minCol = Infinity
        let maxCol = -Infinity

        // First pass: find the actual boundaries considering merged cells
        const processedCells = new Set()
        for (const row of gridMap) {
          for (const mapCell of row) {
            if (!mapCell || !mapCell.cell) {
              continue
            }

            const cellKey = mapCell.cell.getKey()
            if (processedCells.has(cellKey)) {
              continue
            }

            if (tableCells.some((cell) => cell.is(mapCell.cell))) {
              processedCells.add(cellKey)
              // Get the actual position of this cell in the grid
              const cellStartRow = mapCell.startRow
              const cellStartCol = mapCell.startColumn
              const cellRowSpan = mapCell.cell.__rowSpan || 1
              const cellColSpan = mapCell.cell.__colSpan || 1

              // Update boundaries considering the cell's actual position and span
              minRow = Math.min(minRow, cellStartRow)
              maxRow = Math.max(maxRow, cellStartRow + cellRowSpan - 1)
              minCol = Math.min(minCol, cellStartCol)
              maxCol = Math.max(maxCol, cellStartCol + cellColSpan - 1)
            }
          }
        }

        // Validate boundaries
        if (minRow === Infinity || minCol === Infinity) {
          return
        }

        // The total span of the merged cell
        const totalRowSpan = maxRow - minRow + 1
        const totalColSpan = maxCol - minCol + 1

        // Use the top-left cell as the target cell
        const targetCellMap = gridMap?.[minRow]?.[minCol]
        if (!targetCellMap?.cell) {
          return
        }
        const targetCell = targetCellMap.cell

        // Set the spans for the target cell
        targetCell.setColSpan(totalColSpan)
        targetCell.setRowSpan(totalRowSpan)

        // Move content from other cells to the target cell
        const seenCells = new Set([targetCell.getKey()])

        // Second pass: merge content and remove other cells
        for (let row = minRow; row <= maxRow; row++) {
          for (let col = minCol; col <= maxCol; col++) {
            const mapCell = gridMap?.[row]?.[col]
            if (!mapCell?.cell) {
              continue
            }

            const currentCell = mapCell.cell
            const key = currentCell.getKey()

            if (!seenCells.has(key)) {
              seenCells.add(key)
              const isEmpty = $cellContainsEmptyParagraph(currentCell)
              if (!isEmpty) {
                targetCell.append(...currentCell.getChildren())
              }
              currentCell.remove()
            }
          }
        }

        // Ensure target cell has content
        if (targetCell.getChildrenSize() === 0) {
          targetCell.append($createParagraphNode())
        }

        $selectLastDescendant(targetCell)
        onClose()
      }
    })
  }

  const unmergeTableCellsAtSelection = () => {
    editor.update(() => {
      $unmergeCell()
    })
  }

  const insertTableRowAtSelection = useCallback(
    (shouldInsertAfter: boolean) => {
      editor.update(() => {
        for (let i = 0; i < selectionCounts.rows; i++) {
          $insertTableRow__EXPERIMENTAL(shouldInsertAfter)
        }
        onClose()
      })
    },
    [editor, onClose, selectionCounts.rows],
  )

  const insertTableColumnAtSelection = useCallback(
    (shouldInsertAfter: boolean) => {
      editor.update(() => {
        for (let i = 0; i < selectionCounts.columns; i++) {
          $insertTableColumn__EXPERIMENTAL(shouldInsertAfter)
        }
        onClose()
      })
    },
    [editor, onClose, selectionCounts.columns],
  )

  const deleteTableRowAtSelection = useCallback(() => {
    editor.update(() => {
      $deleteTableRow__EXPERIMENTAL()
      onClose()
    })
  }, [editor, onClose])

  const deleteTableAtSelection = useCallback(() => {
    editor.update(() => {
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode)
      tableNode.remove()

      clearTableSelection()
      onClose()
    })
  }, [editor, tableCellNode, clearTableSelection, onClose])

  const deleteTableColumnAtSelection = useCallback(() => {
    editor.update(() => {
      $deleteTableColumn__EXPERIMENTAL()
      onClose()
    })
  }, [editor, onClose])

  const toggleTableRowIsHeader = useCallback(() => {
    editor.update(() => {
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode)

      const tableRowIndex = $getTableRowIndexFromTableCellNode(tableCellNode)

      const [gridMap] = $computeTableMapSkipCellCheck(tableNode, null, null)

      const rowCells = new Set<TableCellNode>()

      const newStyle = tableCellNode.getHeaderStyles() ^ TableCellHeaderStates.ROW
      if (gridMap[tableRowIndex]) {
        for (let col = 0; col < gridMap[tableRowIndex].length; col++) {
          const mapCell = gridMap[tableRowIndex][col]

          if (!mapCell?.cell) {
            continue
          }

          if (!rowCells.has(mapCell.cell)) {
            rowCells.add(mapCell.cell)
            mapCell.cell.setHeaderStyles(newStyle, TableCellHeaderStates.ROW)
          }
        }
      }

      clearTableSelection()
      onClose()
    })
  }, [editor, tableCellNode, clearTableSelection, onClose])

  const toggleTableColumnIsHeader = useCallback(() => {
    editor.update(() => {
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode)

      const tableColumnIndex = $getTableColumnIndexFromTableCellNode(tableCellNode)

      const [gridMap] = $computeTableMapSkipCellCheck(tableNode, null, null)

      const columnCells = new Set<TableCellNode>()

      const newStyle = tableCellNode.getHeaderStyles() ^ TableCellHeaderStates.COLUMN
      if (gridMap) {
        for (let row = 0; row < gridMap.length; row++) {
          const mapCell = gridMap?.[row]?.[tableColumnIndex]

          if (!mapCell?.cell) {
            continue
          }

          if (!columnCells.has(mapCell.cell)) {
            columnCells.add(mapCell.cell)
            mapCell.cell.setHeaderStyles(newStyle, TableCellHeaderStates.COLUMN)
          }
        }
      }

      clearTableSelection()
      onClose()
    })
  }, [editor, tableCellNode, clearTableSelection, onClose])

  const toggleRowStriping = useCallback(() => {
    editor.update(() => {
      if (tableCellNode.isAttached()) {
        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode)
        if (tableNode) {
          tableNode.setRowStriping(!tableNode.getRowStriping())
        }
      }

      clearTableSelection()
      onClose()
    })
  }, [editor, tableCellNode, clearTableSelection, onClose])

  const toggleFirstColumnFreeze = useCallback(() => {
    editor.update(() => {
      if (tableCellNode.isAttached()) {
        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode)
        if (tableNode) {
          tableNode.setFrozenColumns(tableNode.getFrozenColumns() === 0 ? 1 : 0)
        }
      }
      clearTableSelection()
      onClose()
    })
  }, [editor, tableCellNode, clearTableSelection, onClose])

  let mergeCellButton: JSX.Element | null = null
  if (cellMerge) {
    if (canMergeCells) {
      mergeCellButton = (
        <button
          className="item"
          data-test-id="table-merge-cells"
          onClick={() => mergeTableCellsAtSelection()}
          type="button"
        >
          <span className="text">Merge cells</span>
        </button>
      )
    } else if (canUnmergeCell) {
      mergeCellButton = (
        <button
          className="item"
          data-test-id="table-unmerge-cells"
          onClick={() => unmergeTableCellsAtSelection()}
          type="button"
        >
          <span className="text">Unmerge cells</span>
        </button>
      )
    }
  }

  return createPortal(
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions,jsx-a11y/click-events-have-key-events
    <div
      className="table-action-menu-dropdown"
      onClick={(e) => {
        e.stopPropagation()
      }}
      ref={dropDownRef}
    >
      {mergeCellButton ? (
        <React.Fragment>
          {mergeCellButton}
          <hr />
        </React.Fragment>
      ) : null}

      <button
        className="item"
        data-test-id="table-row-striping"
        onClick={() => toggleRowStriping()}
        type="button"
      >
        <span className="text">Toggle Row Striping</span>
      </button>
      <button
        className="item"
        data-test-id="table-freeze-first-column"
        onClick={() => toggleFirstColumnFreeze()}
        type="button"
      >
        <span className="text">Toggle First Column Freeze</span>
      </button>
      <button
        className="item"
        data-test-id="table-insert-row-above"
        onClick={() => insertTableRowAtSelection(false)}
        type="button"
      >
        <span className="text">
          Insert {selectionCounts.rows === 1 ? 'row' : `${selectionCounts.rows} rows`} above
        </span>
      </button>
      <button
        className="item"
        data-test-id="table-insert-row-below"
        onClick={() => insertTableRowAtSelection(true)}
        type="button"
      >
        <span className="text">
          Insert {selectionCounts.rows === 1 ? 'row' : `${selectionCounts.rows} rows`} below
        </span>
      </button>
      <hr />
      <button
        className="item"
        data-test-id="table-insert-column-before"
        onClick={() => insertTableColumnAtSelection(false)}
        type="button"
      >
        <span className="text">
          Insert {selectionCounts.columns === 1 ? 'column' : `${selectionCounts.columns} columns`}{' '}
          left
        </span>
      </button>
      <button
        className="item"
        data-test-id="table-insert-column-after"
        onClick={() => insertTableColumnAtSelection(true)}
        type="button"
      >
        <span className="text">
          Insert {selectionCounts.columns === 1 ? 'column' : `${selectionCounts.columns} columns`}{' '}
          right
        </span>
      </button>
      <hr />
      <button
        className="item"
        data-test-id="table-delete-columns"
        onClick={() => deleteTableColumnAtSelection()}
        type="button"
      >
        <span className="text">Delete column</span>
      </button>
      <button
        className="item"
        data-test-id="table-delete-rows"
        onClick={() => deleteTableRowAtSelection()}
        type="button"
      >
        <span className="text">Delete row</span>
      </button>
      <button
        className="item"
        data-test-id="table-delete"
        onClick={() => deleteTableAtSelection()}
        type="button"
      >
        <span className="text">Delete table</span>
      </button>
      <hr />
      <button
        className="item"
        data-test-id="table-row-header"
        onClick={() => toggleTableRowIsHeader()}
        type="button"
      >
        <span className="text">
          {(tableCellNode.__headerState & TableCellHeaderStates.ROW) === TableCellHeaderStates.ROW
            ? 'Remove'
            : 'Add'}{' '}
          row header
        </span>
      </button>
      <button
        className="item"
        data-test-id="table-column-header"
        onClick={() => toggleTableColumnIsHeader()}
        type="button"
      >
        <span className="text">
          {(tableCellNode.__headerState & TableCellHeaderStates.COLUMN) ===
          TableCellHeaderStates.COLUMN
            ? 'Remove'
            : 'Add'}{' '}
          column header
        </span>
      </button>
    </div>,
    document.body,
  )
}

function TableCellActionMenuContainer({
  anchorElem,
  cellMerge,
}: {
  anchorElem: HTMLElement
  cellMerge: boolean
}): JSX.Element {
  const [editor] = useLexicalComposerContext()

  const menuButtonRef = useRef<HTMLDivElement | null>(null)
  const menuRootRef = useRef<HTMLButtonElement | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const [tableCellNode, setTableMenuCellNode] = useState<null | TableCellNode>(null)

  const $moveMenu = useCallback(() => {
    const menu = menuButtonRef.current
    const selection = $getSelection()
    const nativeSelection = getDOMSelection(editor._window)
    const activeElement = document.activeElement
    function disable() {
      if (menu) {
        menu.classList.remove('table-cell-action-button-container--active')
        menu.classList.add('table-cell-action-button-container--inactive')
      }
      setTableMenuCellNode(null)
    }

    if (selection == null || menu == null) {
      return disable()
    }

    const rootElement = editor.getRootElement()
    let tableObserver: null | TableObserver = null
    let tableCellParentNodeDOM: HTMLElement | null = null

    if (
      $isRangeSelection(selection) &&
      rootElement !== null &&
      nativeSelection !== null &&
      rootElement.contains(nativeSelection.anchorNode)
    ) {
      const tableCellNodeFromSelection = $getTableCellNodeFromLexicalNode(
        selection.anchor.getNode(),
      )

      if (tableCellNodeFromSelection == null) {
        return disable()
      }

      tableCellParentNodeDOM = editor.getElementByKey(tableCellNodeFromSelection.getKey())

      if (tableCellParentNodeDOM == null || !tableCellNodeFromSelection.isAttached()) {
        return disable()
      }

      const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNodeFromSelection)
      const tableElement = getTableElement(tableNode, editor.getElementByKey(tableNode.getKey()))

      if (tableElement === null) {
        throw new Error('TableActionMenu: Expected to find tableElement in DOM')
      }

      tableObserver = getTableObserverFromTableElement(tableElement)
      setTableMenuCellNode(tableCellNodeFromSelection)
    } else if ($isTableSelection(selection)) {
      const anchorNode = $getTableCellNodeFromLexicalNode(selection.anchor.getNode())
      if (!$isTableCellNode(anchorNode)) {
        throw new Error('TableSelection anchorNode must be a TableCellNode')
      }
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(anchorNode)
      const tableElement = getTableElement(tableNode, editor.getElementByKey(tableNode.getKey()))

      if (tableElement === null) {
        throw new Error('TableActionMenu: Expected to find tableElement in DOM')
      }

      tableObserver = getTableObserverFromTableElement(tableElement)
      tableCellParentNodeDOM = editor.getElementByKey(anchorNode.getKey())
    } else if (!activeElement) {
      return disable()
    }
    if (tableObserver === null || tableCellParentNodeDOM === null) {
      return disable()
    }
    const enabled = !tableObserver || !tableObserver.isSelecting
    menu.classList.toggle('table-cell-action-button-container--active', enabled)
    menu.classList.toggle('table-cell-action-button-container--inactive', !enabled)
    if (enabled) {
      const tableCellRect = tableCellParentNodeDOM.getBoundingClientRect()
      const anchorRect = anchorElem.getBoundingClientRect()
      const top = tableCellRect.top - anchorRect.top
      const left = tableCellRect.right - anchorRect.left
      menu.style.transform = `translate(${left}px, ${top}px)`
    }
  }, [editor, anchorElem])

  useEffect(() => {
    // We call the $moveMenu callback every time the selection changes,
    // once up front, and once after each pointerup
    let timeoutId: ReturnType<typeof setTimeout> | undefined = undefined
    const callback = () => {
      timeoutId = undefined
      editor.getEditorState().read($moveMenu)
    }
    const delayedCallback = () => {
      if (timeoutId === undefined) {
        timeoutId = setTimeout(callback, 0)
      }
      return false
    }
    return mergeRegister(
      editor.registerUpdateListener(delayedCallback),
      editor.registerCommand(SELECTION_CHANGE_COMMAND, delayedCallback, COMMAND_PRIORITY_CRITICAL),
      editor.registerRootListener((rootElement, prevRootElement) => {
        if (prevRootElement) {
          prevRootElement.removeEventListener('pointerup', delayedCallback)
        }
        if (rootElement) {
          rootElement.addEventListener('pointerup', delayedCallback)
          delayedCallback()
        }
      }),
      () => clearTimeout(timeoutId),
    )
  })

  const prevTableCellDOM = useRef(tableCellNode)

  useEffect(() => {
    if (prevTableCellDOM.current !== tableCellNode) {
      setIsMenuOpen(false)
    }

    prevTableCellDOM.current = tableCellNode
  }, [prevTableCellDOM, tableCellNode])

  return (
    <div className="table-cell-action-button-container" ref={menuButtonRef}>
      {tableCellNode != null && (
        <React.Fragment>
          <button
            className="table-cell-action-button"
            onClick={(e) => {
              e.stopPropagation()
              setIsMenuOpen(!isMenuOpen)
            }}
            ref={menuRootRef}
            type="button"
          >
            <MeatballsIcon />
          </button>
          {isMenuOpen && (
            <TableActionMenu
              cellMerge={cellMerge}
              contextRef={menuRootRef}
              onClose={() => setIsMenuOpen(false)}
              setIsMenuOpen={setIsMenuOpen}
              tableCellNode={tableCellNode}
            />
          )}
        </React.Fragment>
      )}
    </div>
  )
}

export const TableActionMenuPlugin: PluginComponentWithAnchor = ({ anchorElem }) => {
  const isEditable = useLexicalEditable()
  return createPortal(
    isEditable ? (
      <TableCellActionMenuContainer anchorElem={anchorElem ?? document.body} cellMerge />
    ) : null,
    anchorElem ?? document.body,
  )
}
