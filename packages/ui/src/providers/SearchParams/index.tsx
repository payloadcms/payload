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
 * The SearchParamsProvider is deprecated and will be removed in the next major release. Instead, use the `useSearchParams` hook from `next/navigation` directly. See https://github.com/payloadcms/payload/pull/9581.
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
 * The `useSearchParams` hook is deprecated and will be removed in the next major release. Instead, use the `useSearchParams` hook from `next/navigation` directly. See https://github.com/payloadcms/payload/pull/9581.
 * @example
 * ```tsx
 * import { useSearchParams } from 'next/navigation'
 * ```
 * If you need to parse the `where` query, you can do so with the `parseSearchParams` utility.
 * ```tsx
 * import { parseSearchParams } from '@payloadcms/ui'
 * const parsedSearchParams = parseSearchParams(searchParams)
 * ```
 */
export const useSearchParams = (): SearchParamsContext => useContext(Context)
