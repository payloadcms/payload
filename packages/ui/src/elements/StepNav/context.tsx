'use client'
import React, { createContext, use, useState } from 'react'

import type { ContextType } from './types.js'

export const useStepNav = (): ContextType => use(Context)

export const Context = createContext({} as ContextType)

export const StepNavProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [stepNav, setStepNav] = useState([])

  return (
    <Context
      value={{
        setStepNav,
        stepNav,
      }}
    >
      {children}
    </Context>
  )
}
