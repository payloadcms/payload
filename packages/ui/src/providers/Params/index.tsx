'use client'

import { useParams as useNextParams } from 'next/navigation.js'
import React, { createContext, useContext } from 'react'

export type Params = ReturnType<typeof useNextParams>
interface IParamsContext extends Params {}

const Context = createContext<IParamsContext>({} as IParamsContext)

/**
 * @deprecated
 * This provider is deprecated and will be removed in the next major release. Instead, use the `useParams` hook from `next/navigation` instead. See https://github.com/payloadcms/payload/pull/9576.
 * @example
 * ```tsx
 * import { useParams } from 'next/navigation'
 * ```
 */
export const ParamsProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const params = useNextParams()
  return <Context.Provider value={params}>{children}</Context.Provider>
}

/**
 * @deprecated
 * This provider is deprecated and will be removed in the next major release. Instead, use the `useParams` hook from `next/navigation` instead. See https://github.com/payloadcms/payload/pull/9576.
 * @example
 * ```tsx
 * import { useParams } from 'next/navigation'
 * ```
 */
export const useParams = (): IParamsContext => useContext(Context)
