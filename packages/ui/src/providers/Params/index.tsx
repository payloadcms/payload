'use client'

import React, { createContext, use } from 'react'

import { useParams as useNextParams } from '../RouterAdapter/index.js'

export type Params = ReturnType<typeof useNextParams>
interface IParamsContext extends Params {}

const Context = createContext<IParamsContext>({})

/**
 * @deprecated
 * The ParamsProvider is deprecated and will be removed in the next major release. Instead, use the `useParams` hook from `@payloadcms/ui` directly. See https://github.com/payloadcms/payload/pull/9581.
 */
export const ParamsProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const params = useNextParams()
  return <Context value={params}>{children}</Context>
}

/**
 * @deprecated
 * The `useParams` hook is deprecated and will be removed in the next major release. Instead, use the `useParams` hook from `@payloadcms/ui` directly. See https://github.com/payloadcms/payload/pull/9581.
 */
export const useParams = (): IParamsContext => use(Context)
