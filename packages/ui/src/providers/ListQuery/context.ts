import { createContext, useContext } from 'react'

import type { IListQueryContext } from './types.js'

export const ListQueryContext = createContext({} as IListQueryContext)

export const useListQuery = (): IListQueryContext => useContext(ListQueryContext)
