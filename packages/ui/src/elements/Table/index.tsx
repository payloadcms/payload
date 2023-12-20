import React from 'react'

import type { Props } from './types'

import { useTableColumns } from '../TableColumns'
import './index.scss'

const baseClass = 'table'

export const Table: React.FC<Props> = ({ columns: columnsFromProps, data }) => {
  const { columns: columnsFromContext } = useTableColumns()

  const columns = columnsFromProps || columnsFromContext
  const activeColumns = columns?.filter((col) => col.active)

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
                {columns.map((col, colIndex) => {
                  const { active } = col

                  if (!active) return null

                  return (
                    <td className={`cell-${col.accessor}`} key={colIndex}>
                      {col.components.renderCell(row, row[col.accessor])}
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
