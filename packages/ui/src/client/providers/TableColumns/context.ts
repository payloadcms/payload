import { createContext, use } from 'react'

import type { ITableColumns } from './types.js'

export const TableColumnContext = createContext<ITableColumns>({} as ITableColumns)

export const useTableColumns = (): ITableColumns => use(TableColumnContext)
