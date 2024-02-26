'use client'
import React, { createContext, useContext } from 'react'

export const OperationContext = createContext('' as Operation)

export const OperationProvider: React.FC<{ children: React.ReactNode; operation: Operation }> = ({
  children,
  operation,
}) => <OperationContext.Provider value={operation}>{children}</OperationContext.Provider>

export type Operation = 'create' | 'update'

export const useOperation = (): Operation | undefined => useContext(OperationContext)
