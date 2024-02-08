'use client'
import { CellComponentProps, CellProps } from 'payload/types'
import React from 'react'

export type ITableCellContext = {
  rowData: any
  cellData: any
  customCellContext: CellComponentProps['customCellContext']
  cellProps?: Partial<CellProps>
  columnIndex?: number
}

const TableCellContext = React.createContext<ITableCellContext>({} as ITableCellContext)

export const TableCellProvider: React.FC<{
  cellData: any
  rowData: any
  customCellContext: CellComponentProps['customCellContext']
  cellProps?: Partial<CellProps>
  children: React.ReactNode
  columnIndex?: number
}> = (props) => {
  const { children, rowData, cellData, customCellContext, columnIndex, cellProps } = props

  return (
    <TableCellContext.Provider
      value={{ cellData, rowData, customCellContext, columnIndex, cellProps }}
    >
      {children}
    </TableCellContext.Provider>
  )
}

export const useTableCell = () => {
  const cell = React.useContext(TableCellContext)
  return cell
}
