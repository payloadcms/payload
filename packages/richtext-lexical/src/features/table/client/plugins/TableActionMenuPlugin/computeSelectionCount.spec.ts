import { createHeadlessEditor } from '@lexical/headless'
import {
  $createTableCellNode,
  $createTableNode,
  $createTableRowNode,
  $createTableSelectionFrom,
  TableCellHeaderStates,
  TableCellNode,
  TableNode,
  TableRowNode,
} from '@lexical/table'
import { $createParagraphNode, $getRoot } from 'lexical'
import { describe, expect, it } from 'vitest'

import { $computeSelectionCount } from './computeSelectionCount.js'

describe('$computeSelectionCount', () => {
  it.each([false, true])(
    'should expand a selection to include intersecting merged cells (backward: %s)',
    (isBackward) => {
      const editor = createHeadlessEditor({
        nodes: [TableNode, TableRowNode, TableCellNode],
        onError: (error) => {
          throw error
        },
      })

      editor.update(
        () => {
          const table = $createTableNode()
          const firstRow = $createTableRowNode()
          const secondRow = $createTableRowNode()
          const thirdRow = $createTableRowNode()
          const mergedCell = $createTableCellNode(TableCellHeaderStates.NO_STATUS, 2)
          const topLeft = $createTableCellNode()
          const topMiddle = $createTableCellNode()
          const topRight = $createTableCellNode()
          const middleRight = $createTableCellNode()
          const bottomLeft = $createTableCellNode()
          const bottomMiddle = $createTableCellNode()
          const bottomRight = $createTableCellNode()

          for (const cell of [
            topLeft,
            topMiddle,
            topRight,
            mergedCell,
            middleRight,
            bottomLeft,
            bottomMiddle,
            bottomRight,
          ]) {
            cell.append($createParagraphNode())
          }

          firstRow.append(topLeft, topMiddle, topRight)
          secondRow.append(mergedCell, middleRight)
          thirdRow.append(bottomLeft, bottomMiddle, bottomRight)
          table.append(firstRow, secondRow, thirdRow)
          $getRoot().append(table)

          const selection = $createTableSelectionFrom(
            table,
            isBackward ? bottomMiddle : topMiddle,
            isBackward ? topMiddle : bottomMiddle,
          )

          expect($computeSelectionCount({ selection })).toEqual({ columns: 2, rows: 3 })
        },
        { discrete: true },
      )
    },
  )

  it('should include every row and column spanned by a single merged cell', () => {
    const editor = createHeadlessEditor({
      nodes: [TableNode, TableRowNode, TableCellNode],
      onError: (error) => {
        throw error
      },
    })

    editor.update(
      () => {
        const table = $createTableNode()
        const firstRow = $createTableRowNode()
        const secondRow = $createTableRowNode()
        const mergedCell = $createTableCellNode(TableCellHeaderStates.NO_STATUS, 2).setRowSpan(2)

        mergedCell.append($createParagraphNode())
        firstRow.append(mergedCell)
        table.append(firstRow, secondRow)
        $getRoot().append(table)

        const selection = $createTableSelectionFrom(table, mergedCell, mergedCell)

        expect($computeSelectionCount({ selection })).toEqual({ columns: 2, rows: 2 })
      },
      { discrete: true },
    )
  })
})
