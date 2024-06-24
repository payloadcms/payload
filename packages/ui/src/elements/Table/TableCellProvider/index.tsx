'use client'
import type { CellComponentProps, DefaultCellComponentProps } from 'payload'

import React from 'react'

export type ITableCellContext = {
  cellData: DefaultCellComponentProps['cellData']
  cellProps?: Partial<CellComponentProps>
  columnIndex?: number
  customCellContext: DefaultCellComponentProps['customCellContext']
  rowData: DefaultCellComponentProps['rowData']
}

const TableCellContext = React.createContext<ITableCellContext>({} as ITableCellContext)

export const TableCellProvider: React.FC<{
  cellData?: DefaultCellComponentProps['cellData']
  cellProps?: Partial<CellComponentProps>
  children: React.ReactNode
  columnIndex?: number
  customCellContext?: DefaultCellComponentProps['customCellContext']
  rowData?: DefaultCellComponentProps['rowData']
}> = (props) => {
  const { cellData, cellProps, children, columnIndex, customCellContext, rowData } = props

  const contextToInherit = useTableCell()

  return (
    <TableCellContext.Provider
      value={{
        cellData,
        cellProps,
        columnIndex,
        customCellContext,
        rowData,
        ...contextToInherit,
      }}
    >
      {children}
    </TableCellContext.Provider>
  )
}

export const useTableCell = () => {
  const cell = React.useContext(TableCellContext)
  return cell
}
