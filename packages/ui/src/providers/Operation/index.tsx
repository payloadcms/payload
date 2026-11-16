'use client'
import React, { createContext, use } from 'react'

export const OperationContext = createContext('' as Operation)

/**
 * Provides the current `create` or `update` operation for form-state requests, field permissions, validation, and document actions.
 * Nest this provider when a form's operation differs from the surrounding document.
 */
export const OperationProvider: React.FC<{ children: React.ReactNode; operation: Operation }> = ({
  children,
  operation,
}) => <OperationContext value={operation}>{children}</OperationContext>

export type Operation = 'create' | 'update'

/** Returns the nearest operation used by fields and form actions to distinguish creation from updates. */
export const useOperation = (): Operation | undefined => use(OperationContext)
