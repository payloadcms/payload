'use client'
import React, { createContext, useContext } from 'react'

export const Context = createContext(false)

export const RowProvider: React.FC<{ children?: React.ReactNode; withinRow?: boolean }> = ({
  children,
  withinRow = true,
}) => {
  return <Context.Provider value={withinRow}>{children}</Context.Provider>
}

export const useRow = (): boolean => useContext(Context)
