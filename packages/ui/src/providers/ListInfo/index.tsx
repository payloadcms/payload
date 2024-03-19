'use client'
import React, { createContext, useContext } from 'react'

import type { ColumnPreferences, ListInfo, ListInfoContext, ListInfoProps } from './types.js'

export type { ColumnPreferences, ListInfo, ListInfoContext, ListInfoProps }

const Context = createContext({} as ListInfoContext)

export const useListInfo = (): ListInfoContext => useContext(Context)

export const ListInfoProvider: React.FC<
  ListInfoProps & {
    children: React.ReactNode
  }
> = ({ children, ...rest }) => {
  return <Context.Provider value={{ ...rest }}>{children}</Context.Provider>
}
