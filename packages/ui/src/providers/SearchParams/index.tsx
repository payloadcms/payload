'use client'

import { useSearchParams as useNextSearchParams } from 'next/navigation.js'
import * as qs from 'qs-esm'
import React, { createContext, useContext } from 'react'

import { parseSearchParams } from '../../utilities/parseSearchParams.js'

export type SearchParamsContext = {
  searchParams: qs.ParsedQs
  stringifyParams: ({ params, replace }: { params: qs.ParsedQs; replace?: boolean }) => string
}

const initialContext: SearchParamsContext = {
  searchParams: {},
  stringifyParams: () => '',
}

const Context = createContext(initialContext)

/**
 * @deprecated
 * This provider is deprecated and will be removed in the next major release. Instead, use the `useSearchParams` hook from `next/navigation` instead. See https://github.com/payloadcms/payload/pull/9576.
 * @example
 * ```tsx
 * import { useSearchParams } from 'next/navigation'
 * ```
 */
export const SearchParamsProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const nextSearchParams = useNextSearchParams()

  const [searchParams, setSearchParams] = React.useState(() => parseSearchParams(nextSearchParams))

  const stringifyParams = React.useCallback(
    ({ params, replace = false }: { params: qs.ParsedQs; replace?: boolean }) => {
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
    setSearchParams(parseSearchParams(nextSearchParams))
  }, [nextSearchParams])

  return <Context.Provider value={{ searchParams, stringifyParams }}>{children}</Context.Provider>
}

/**
 * @deprecated
 * This provider is deprecated and will be removed in the next major release. Instead, use the `useParams` hook from `next/navigation` instead. See https://github.com/payloadcms/payload/pull/9576.
 * @example
 * ```tsx
 * import { useParams } from 'next/navigation'
 * ```
 */
export const useSearchParams = (): SearchParamsContext => useContext(Context)
