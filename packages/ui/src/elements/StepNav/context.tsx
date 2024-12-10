'use client'
import React, { createContext, useContext, useState } from 'react'

import type { ContextType } from './types.js'

export const useStepNav = (): ContextType => useContext(Context)

export const Context = createContext({} as ContextType)

export const StepNavProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [stepNav, setStepNav] = useState([])

  return (
    <Context.Provider
      value={{
        setStepNav,
        stepNav,
      }}
    >
      {children}
    </Context.Provider>
  )
}
