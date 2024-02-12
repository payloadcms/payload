'use client'
import React from 'react'

import type { Props } from './types'

import { useTableColumns } from '../TableColumns'
import { TableCellProvider } from './TableCellProvider'

import './index.scss'

const baseClass = 'table'

export const Table: React.FC<Props> = ({ columns: columnsFromProps, data, customCellContext }) => {
  const { columns: columnsFromContext } = useTableColumns()

  const columns = columnsFromProps || columnsFromContext

  const activeColumns = columns?.filter((col) => col?.active)

  if (!activeColumns || activeColumns.length === 0) {
    return <div>No columns selected</div>
  }

  return (
    <div className={baseClass}>
      <table cellPadding="0" cellSpacing="0">
        <thead>
          <tr>
            {activeColumns.map((col, i) => (
              <th id={`heading-${col.accessor}`} key={i}>
                {col.components.Heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data &&
            data.map((row, rowIndex) => (
              <tr className={`row-${rowIndex + 1}`} key={rowIndex}>
                {activeColumns.map((col, colIndex) => {
                  return (
                    <td className={`cell-${col.accessor}`} key={colIndex}>
                      <TableCellProvider
                        rowData={row}
                        cellData={row[col.accessor]}
                        customCellContext={customCellContext}
                        cellProps={col?.cellProps}
                        columnIndex={colIndex}
                      >
                        {col.components.Cell}
                      </TableCellProvider>
                    </td>
                  )
                })}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}

export default Table
