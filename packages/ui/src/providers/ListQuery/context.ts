import { createContext, useContext } from 'react'

import type { ListQueryContext } from './types.js'

const ListQueryModifiedContext = createContext(false)
const useQueryModified = (): boolean => useContext(ListQueryModifiedContext)

const ListQueryContext = createContext({} as ListQueryContext)

const useListQuery = (): ListQueryContext => useContext(ListQueryContext)

export { ListQueryContext, ListQueryModifiedContext, useListQuery, useQueryModified }
