'use client'

import * as qs from 'qs-esm'
import React, { createContext, use } from 'react'

import { useSearchParams as useNextSearchParams } from '../RouterAdapter/index.js'

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
 * The SearchParamsProvider is deprecated and will be removed in the next major release. Instead, use the `useSearchParams` hook from `@payloadcms/ui` directly. See https://github.com/payloadcms/payload/pull/9581.
 */
export const SearchParamsProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const nextSearchParams = useNextSearchParams()
  const searchString = nextSearchParams.toString()

  const searchParams = React.useMemo(
    () =>
      qs.parse(searchString, {
        depth: 10,
        ignoreQueryPrefix: true,
      }),
    [searchString],
  )

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

  return <Context value={{ searchParams, stringifyParams }}>{children}</Context>
}

/**
 * @deprecated
 * The `useSearchParams` hook is deprecated and will be removed in the next major release. Instead, use the `useSearchParams` hook from `@payloadcms/ui` directly. See https://github.com/payloadcms/payload/pull/9581.
 * If you need to parse the `where` query, you can do so with the `parseSearchParams` utility.
 * ```tsx
 * import { parseSearchParams } from '@payloadcms/ui'
 * const parsedSearchParams = parseSearchParams(searchParams)
 * ```
 */
export const useSearchParams = (): SearchParamsContext => use(Context)
