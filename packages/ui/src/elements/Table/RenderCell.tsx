import type { CellComponentProps } from 'payload'

import React, { useMemo } from 'react'

import type { Column } from './index.js'

import { deepMergeSimple } from '../../utilities/deepMerge.js'
import { RenderComponent } from '../RenderComponent/index.js'
import { TableCellProvider } from './TableCellProvider/index.js'

export const RenderCell: React.FC<{
  readonly cellProps?: Partial<CellComponentProps>
  readonly col: Column
  readonly colIndex: number
  readonly customCellContext?: Record<string, unknown>
  readonly row: Record<string, unknown>
}> = (props) => {
  const { cellProps: cellPropsFromProps, col, colIndex, customCellContext, row } = props

  const cellProps: Partial<CellComponentProps> = useMemo(
    () => deepMergeSimple(col?.cellProps || {}, cellPropsFromProps || {}),
    [cellPropsFromProps, col.cellProps],
  )

  return (
    <td className={`cell-${col.accessor}`} key={colIndex}>
      <TableCellProvider
        cellData={row[col.accessor]}
        cellProps={cellProps}
        columnIndex={colIndex}
        customCellContext={customCellContext}
        rowData={row}
      >
        <RenderComponent
          clientProps={cellProps}
          mappedComponent={cellProps?.field?.admin?.components?.Cell}
        />
      </TableCellProvider>
    </td>
  )
}
