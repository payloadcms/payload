import qs from 'qs'
import React, { createContext, useContext } from 'react'
import { useLocation } from 'react-router-dom'

const Context = createContext({})

export const SearchParamsProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const location = useLocation()

  const params = qs.parse(location.search, { depth: 10, ignoreQueryPrefix: true })

  return <Context.Provider value={params}>{children}</Context.Provider>
}

export const useSearchParams = (): qs.ParsedQs => useContext(Context)
