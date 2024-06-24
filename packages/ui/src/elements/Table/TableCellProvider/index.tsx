'use client'
import type { CellComponentProps, DefaultCellComponentProps } from 'payload/types'

import React from 'react'

export type ITableCellContext = {
  cellData: DefaultCellComponentProps['cellData']
  cellProps?: Partial<CellComponentProps>
  columnIndex?: number
  customCellContext: DefaultCellComponentProps['customCellContext']
  richTextComponentMap?: DefaultCellComponentProps['richTextComponentMap']
  rowData: DefaultCellComponentProps['rowData']
}

const TableCellContext = React.createContext<ITableCellContext>({} as ITableCellContext)

export const TableCellProvider: React.FC<{
  cellData?: DefaultCellComponentProps['cellData']
  cellProps?: Partial<CellComponentProps>
  children: React.ReactNode
  columnIndex?: number
  customCellContext?: DefaultCellComponentProps['customCellContext']
  richTextComponentMap?: DefaultCellComponentProps['richTextComponentMap']
  rowData?: DefaultCellComponentProps['rowData']
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
        rowData,
        ...contextToInherit,
        richTextComponentMap,
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
