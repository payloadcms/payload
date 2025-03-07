import { createContext, useContext } from 'react'

import type { ITableColumns } from './types.js'

export const TableColumnContext = createContext<ITableColumns>({} as ITableColumns)

export const useTableColumns = (): ITableColumns => useContext(TableColumnContext)
