'use client'
import type { CellComponentProps, CellProps } from 'payload/types'

import React from 'react'

export type ITableCellContext = {
  cellData: any
  cellProps?: Partial<CellProps>
  columnIndex?: number
  customCellContext: CellComponentProps['customCellContext']
  richTextComponentMap?: CellComponentProps['richTextComponentMap']
  rowData: any
}

const TableCellContext = React.createContext<ITableCellContext>({} as ITableCellContext)

export const TableCellProvider: React.FC<{
  cellData?: any
  cellProps?: Partial<CellProps>
  children: React.ReactNode
  columnIndex?: number
  customCellContext?: CellComponentProps['customCellContext']
  richTextComponentMap?: CellComponentProps['richTextComponentMap']
  rowData?: any
}> = (props) => {
  const {
    cellData,
    cellProps,
    children,
    columnIndex,
    customCellContext,
    richTextComponentMap,
    rowData,
  } = props

  const contextToInherit = useTableCell()

  return (
    <TableCellContext.Provider
      value={{
        cellData,
        cellProps,
        columnIndex,
        customCellContext,
        richTextComponentMap,
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
