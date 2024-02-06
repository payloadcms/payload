'use client'
import React from 'react'

const TableCellContext = React.createContext<{
  rowData: any
  cellData: any
  customCellContext: any
  columnIndex?: number
}>({} as any)

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
