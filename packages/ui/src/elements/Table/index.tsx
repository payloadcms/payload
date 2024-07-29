'use client'
import type { CellComponentProps, FieldBase, FieldMap, FieldTypes } from 'payload'

import React from 'react'

export * from './TableCellProvider/index.js'

import { useTableColumns } from '../TableColumns/index.js'
import { TableCellProvider } from './TableCellProvider/index.js'
import './index.scss'

export { TableCellProvider }

const baseClass = 'table'

export type Column = {
  Label: React.ReactNode
  accessor: string
  active: boolean
  admin?: FieldBase['admin']
  cellProps?: Partial<CellComponentProps>
  components: {
    Cell: React.ReactNode
    Heading: React.ReactNode
  }
  name: FieldBase['name']
  type: keyof FieldTypes
}

export type Props = {
  columns?: Column[]
  customCellContext?: Record<string, unknown>
  data: Record<string, unknown>[]
  fieldMap: FieldMap
}

export const Table: React.FC<Props> = ({ columns: columnsFromProps, customCellContext, data }) => {
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
                  function getCellData(row: Record<string, unknown>, col: Column) {
                    if (col.cellProps?.schemaPath) {
                      return col.cellProps.schemaPath.split('.').reduce((acc, key) => {
                        return acc?.[key]
                      }, row)
                    } else {
                      return row[col.accessor]
                    }
                  }

                  return (
                    <td className={`cell-${col.accessor}`} key={colIndex}>
                      <TableCellProvider
                        cellData={getCellData(row, col)}
                        cellProps={col?.cellProps}
                        columnIndex={colIndex}
                        customCellContext={customCellContext}
                        rowData={row}
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
