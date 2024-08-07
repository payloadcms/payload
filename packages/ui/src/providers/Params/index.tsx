'use client'

import { useParams as useNextParams } from 'next/navigation.js'
import React, { createContext, useContext } from 'react'

export type Params = ReturnType<typeof useNextParams>
interface IParamsContext extends Params {}

const Context = createContext<IParamsContext>({} as IParamsContext)

// TODO: abstract the `next/navigation` dependency out from this provider so that it can be used in other contexts
export const ParamsProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const params = useNextParams()
  return <Context.Provider value={params}>{children}</Context.Provider>
}

export const useParams = (): IParamsContext => useContext(Context)
