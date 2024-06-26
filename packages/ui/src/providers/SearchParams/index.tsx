'use client'
import { useSearchParams as useNextSearchParams } from 'next/navigation.js'
import { parse, stringify } from 'picoquery'
import React, { createContext, useContext } from 'react'

export type SearchParamsContext = {
  searchParams: any
  stringifyParams: ({ params, replace }: { params: State; replace?: boolean }) => string
}

export type State = any

const initialContext: SearchParamsContext = {
  searchParams: {},
  stringifyParams: () => '',
}

const Context = createContext(initialContext)

function createParams(search: string) {
  return parse(search, {
    nestingSyntax: 'index',
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
      return `?${stringify(
        {
          ...(replace ? {} : searchParams),
          ...params,
        },
        { nestingSyntax: 'index' },
      )}`
    },
    [searchParams],
  )

  React.useEffect(() => {
    setSearchParams(createParams(searchString))
  }, [searchString])

  return <Context.Provider value={{ searchParams, stringifyParams }}>{children}</Context.Provider>
}

export const useSearchParams = (): SearchParamsContext => useContext(Context)
