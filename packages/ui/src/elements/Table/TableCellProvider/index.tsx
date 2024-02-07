'use client'
import { CellComponentProps, SanitizedCollectionConfig } from 'payload/types'
import React from 'react'

export type ITableCellContext = {
  rowData: any
  cellData: any
  customCellContext: CellComponentProps['customCellContext']
  columnIndex?: number
}

const TableCellContext = React.createContext<ITableCellContext>({} as ITableCellContext)

export const TableCellProvider: React.FC<{
  cellData: any
  rowData: any
  customCellContext?: any
  children: React.ReactNode
  columnIndex?: number
}> = (props) => {
  const { children, rowData, cellData, customCellContext, columnIndex } = props

  return (
    <TableCellContext.Provider value={{ cellData, rowData, customCellContext, columnIndex }}>
      {children}
    </TableCellContext.Provider>
  )
}

export const useTableCell = () => {
  const cell = React.useContext(TableCellContext)
  return cell
}
