'use client'
import type { ReadonlyURLSearchParams } from 'next/navigation.js'

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

export function createParams(params: ReadonlyURLSearchParams): State {
  const search = params.toString()

  return qs.parse(search, {
    depth: 10,
    ignoreQueryPrefix: true,
  })
}

// TODO: this provider should likely be marked as deprecated and then removed in the next major release
export const SearchParamsProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const nextSearchParams = useNextSearchParams()

  const [searchParams, setSearchParams] = React.useState(() => createParams(nextSearchParams))

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
    setSearchParams(createParams(nextSearchParams))
  }, [nextSearchParams])

  return <Context.Provider value={{ searchParams, stringifyParams }}>{children}</Context.Provider>
}

export const useSearchParams = (): SearchParamsContext => useContext(Context)
