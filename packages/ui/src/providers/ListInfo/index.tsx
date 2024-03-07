'use client'
import React, { createContext, useContext, useState } from 'react'

import type { ListInfo, ListInfoContext, ListInfoProps } from './types.js'

import { useConfig } from '../Config/index.js'

const Context = createContext({} as ListInfoContext)

export const useListInfo = (): ListInfoContext => useContext(Context)

export const ListInfoProvider: React.FC<
  ListInfoProps & {
    children: React.ReactNode
  }
> = ({ children, ...rest }) => {
  const [listInfo, setListInfo] = useState<ListInfo>({
    ...rest,
  })

  const {
    collections,
    globals,
    routes: { api },
    serverURL,
  } = useConfig()

  const value: ListInfoContext = {
    ...listInfo,
  }

  return <Context.Provider value={value}>{children}</Context.Provider>
}
