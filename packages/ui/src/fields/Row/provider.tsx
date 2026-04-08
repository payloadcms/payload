'use client'
import React, { createContext, use } from 'react'

export const Context = createContext(false)

export const RowProvider: React.FC<{ children?: React.ReactNode; withinRow?: boolean }> = ({
  children,
  withinRow = true,
}) => {
  return <Context value={withinRow}>{children}</Context>
}

export const useRow = (): boolean => use(Context)
