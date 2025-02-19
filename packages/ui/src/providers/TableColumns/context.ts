import { createContext, useContext } from 'react'

import type { ITableColumns } from './types.js'

const TableColumnsModifiedContext = createContext(false)

const useColumnsModified = (): boolean => useContext(TableColumnsModifiedContext)

const TableColumnContext = createContext<ITableColumns>({} as ITableColumns)

const useTableColumns = (): ITableColumns => useContext(TableColumnContext)

export { TableColumnContext, TableColumnsModifiedContext, useColumnsModified, useTableColumns }
