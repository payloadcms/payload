'use client'
import React, { createContext, use } from 'react'

export const OperationContext = createContext('' as Operation)

/** @internal */
export const OperationProvider: React.FC<{ children: React.ReactNode; operation: Operation }> = ({
  children,
  operation,
}) => <OperationContext value={operation}>{children}</OperationContext>

export type Operation = 'create' | 'update'

export const useOperation = (): Operation | undefined => use(OperationContext)
