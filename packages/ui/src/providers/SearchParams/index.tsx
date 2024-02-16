'use client'
import { useSearchParams as useNextSearchParams } from 'next/navigation'
import qs from 'qs'
import React, { createContext, useContext } from 'react'

interface ISearchParamsContext extends qs.ParsedQs {}

const Context = createContext<ISearchParamsContext>({} as ISearchParamsContext)

// TODO: abstract the `next/navigation` dependency out from this provider so that it can be used in other contexts
export const SearchParamsProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const nextSearchParams = useNextSearchParams()
  const searchParams = qs.parse(nextSearchParams.toString(), { depth: 10, ignoreQueryPrefix: true })
  return <Context.Provider value={searchParams}>{children}</Context.Provider>
}

export const useSearchParams = (): ISearchParamsContext => useContext(Context)
