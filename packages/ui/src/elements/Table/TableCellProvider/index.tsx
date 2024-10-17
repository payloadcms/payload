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
  readonly cellData?: DefaultCellComponentProps['cellData']
  readonly cellProps?: Partial<CellComponentProps>
  readonly children: React.ReactNode
  readonly columnIndex?: number
  readonly customCellContext?: DefaultCellComponentProps['customCellContext']
  readonly rowData?: DefaultCellComponentProps['rowData']
}> = (props) => {
  const { cellData, cellProps, children, columnIndex, customCellContext, rowData } = props

  const contextToInherit = useTableCell()

  return (
    <TableCellContext.Provider
      value={{
        ...contextToInherit,
        cellData,
        cellProps,
        columnIndex,
        customCellContext,
        rowData,
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
