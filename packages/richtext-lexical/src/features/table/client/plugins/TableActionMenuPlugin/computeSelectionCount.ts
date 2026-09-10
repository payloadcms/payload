import type { TableSelection } from '@lexical/table'

import { $computeTableCellRectBoundary, $computeTableMap, $getNodeTriplet } from '@lexical/table'

export function $computeSelectionCount({ selection }: { selection: TableSelection }): {
  columns: number
  rows: number
} {
  const [anchorCell, , table] = $getNodeTriplet(selection.anchor)
  const [focusCell] = $getNodeTriplet(selection.focus)
  const [map, anchor, focus] = $computeTableMap(table, anchorCell, focusCell)
  const { maxColumn, maxRow, minColumn, minRow } = $computeTableCellRectBoundary(map, anchor, focus)

  return {
    columns: maxColumn - minColumn + 1,
    rows: maxRow - minRow + 1,
  }
}
