'use client'
import React, { createContext, useContext } from 'react'

import type { MainMenu } from '../../payload-types'

export type MainMenuType = MainMenu

export interface IGlobals {
  mainMenu: MainMenuType
}

export const GlobalsContext = createContext<IGlobals>({} as IGlobals)
export const useGlobals = (): IGlobals => useContext(GlobalsContext)

export const GlobalsProvider: React.FC<
  IGlobals & {
    children: React.ReactNode
  }
> = (props) => {
  const { children, mainMenu } = props

  return (
    <GlobalsContext.Provider
      value={{
        mainMenu,
      }}
    >
      {children}
    </GlobalsContext.Provider>
  )
}
