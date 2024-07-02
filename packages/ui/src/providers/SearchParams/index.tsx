'use client'
import { useSearchParams as useNextSearchParams } from 'next/navigation.js'
import * as qs from 'qs-esm'
import React, { createContext, useContext } from 'react'

export type SearchParamsContext = {
  searchParams: qs.ParsedQs
  stringifyParams: ({ params, replace }: { params: State; replace?: boolean }) => string
}

export type State = qs.ParsedQs

const initialContext: SearchParamsContext = {
  searchParams: {},
  stringifyParams: () => '',
}

const Context = createContext(initialContext)

function createParams(search: string) {
  return qs.parse(search, {
    depth: 10,
    ignoreQueryPrefix: true,
  })
}

// TODO: abstract the `next/navigation` dependency out from this provider so that it can be used in other contexts
export const SearchParamsProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const nextSearchParams = useNextSearchParams()
  const searchString = nextSearchParams.toString()
  const initialParams = createParams(searchString)

  const [searchParams, setSearchParams] = React.useState(initialParams)

  const stringifyParams = React.useCallback(
    ({ params, replace = false }: { params: State; replace?: boolean }) => {
      return qs.stringify(
        {
          ...(replace ? {} : searchParams),
          ...params,
        },
        { addQueryPrefix: true },
      )
    },
    [searchParams],
  )

  React.useEffect(() => {
    setSearchParams(createParams(searchString))
  }, [searchString])

  return <Context.Provider value={{ searchParams, stringifyParams }}>{children}</Context.Provider>
}

export const useSearchParams = (): SearchParamsContext => useContext(Context)
