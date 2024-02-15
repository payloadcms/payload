'use client'
import { useSearchParams as useNextSearchParams } from 'next/navigation'
import qs from 'qs'
import React, { createContext, useContext } from 'react'

const Context = createContext({})

export const SearchParamsProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const searchParams = useNextSearchParams()

  const params = qs.parse(searchParams.toString(), { depth: 10, ignoreQueryPrefix: true })

  return <Context.Provider value={params}>{children}</Context.Provider>
}

export const useSearchParams = (): qs.ParsedQs => useContext(Context)
