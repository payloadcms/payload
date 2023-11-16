import { createContext, useContext } from 'react'

export const OperationContext = createContext('' as Operation)

export type Operation = 'create' | 'update'

export const useOperation = (): Operation | undefined => useContext(OperationContext)
