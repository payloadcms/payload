'use client'
import type { CellComponentProps, CellProps } from 'payload/types'

import React from 'react'

export type ITableCellContext = {
  cellData: any
  cellProps?: Partial<CellProps>
  columnIndex?: number
  customCellContext: CellComponentProps['customCellContext']
  rowData: any
}

const TableCellContext = React.createContext<ITableCellContext>({} as ITableCellContext)

export const TableCellProvider: React.FC<{
  cellData: any
  cellProps?: Partial<CellProps>
  children: React.ReactNode
  columnIndex?: number
  customCellContext: CellComponentProps['customCellContext']
  rowData: any
}> = (props) => {
  const { cellData, cellProps, children, columnIndex, customCellContext, rowData } = props

  return (
    <TableCellContext.Provider
      value={{ cellData, cellProps, columnIndex, customCellContext, rowData }}
    >
      {children}
    </TableCellContext.Provider>
  )
}

export const useTableCell = () => {
  const cell = React.useContext(TableCellContext)
  return cell
}
