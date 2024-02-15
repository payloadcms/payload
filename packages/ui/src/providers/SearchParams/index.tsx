'use client'
import { Params } from 'next/dist/shared/lib/router/utils/route-matcher'
import { useSearchParams as useNextSearchParams, useParams as useNextParams } from 'next/navigation'
import qs from 'qs'
import React, { createContext, useContext } from 'react'

interface IParamsContext {
  searchParams: qs.ParsedQs
  params: Params
}

const Context = createContext<IParamsContext>({
  searchParams: {},
  params: {},
} as IParamsContext)

// TODO: abstract the `next/navigation` dependency out from this provider so that it can be used in other contexts
export const SearchParamsProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const nextSearchParams = useNextSearchParams()
  const params = useNextParams()

  const searchParams = qs.parse(nextSearchParams.toString(), { depth: 10, ignoreQueryPrefix: true })

  return <Context.Provider value={{ searchParams, params }}>{children}</Context.Provider>
}

export const useSearchParams = (): IParamsContext => useContext(Context)
