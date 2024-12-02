'use client'

import { useParams as useNextParams } from 'next/navigation.js'
import React, { createContext, useContext } from 'react'

export type Params = ReturnType<typeof useNextParams>
interface IParamsContext extends Params {}

const Context = createContext<IParamsContext>({} as IParamsContext)

/**
 * @deprecated
 * The ParamsProvider is deprecated and will be removed in the next major release. Instead, use the `useParams` hook from `next/navigation` directly. See https://github.com/payloadcms/payload/pull/9581.
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
 * The `useParams` hook is deprecated and will be removed in the next major release. Instead, use the `useParams` hook from `next/navigation` directly. See https://github.com/payloadcms/payload/pull/9581.
 * @example
 * ```tsx
 * import { useParams } from 'next/navigation'
 * ```
 */
export const useParams = (): IParamsContext => useContext(Context)
