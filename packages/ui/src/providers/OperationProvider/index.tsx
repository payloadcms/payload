'use client'
import React, { createContext, useContext } from 'react'

export const OperationContext = createContext('' as Operation)

export const OperationProvider: React.FC<{ operation: Operation; children: React.ReactNode }> = ({
  children,
  operation,
}) => <OperationContext.Provider value={operation}>{children}</OperationContext.Provider>

export type Operation = 'create' | 'update'

export const useOperation = (): Operation | undefined => useContext(OperationContext)
