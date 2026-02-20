import { createContext, use } from 'react'

import type { IListQueryContext } from './types.js'

export const ListQueryContext = createContext({} as IListQueryContext)

export const useListQuery = (): IListQueryContext => use(ListQueryContext)

export const ListQueryModifiedContext = createContext(false)

export const useListQueryModified = (): boolean => use(ListQueryModifiedContext)
