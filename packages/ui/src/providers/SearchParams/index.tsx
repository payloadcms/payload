'use client'
import { useSearchParams as useNextSearchParams, useRouter } from 'next/navigation.js'
import qs from 'qs'
import React, { createContext, useContext } from 'react'

import type { Action, SearchParamsContext, State } from './types.js'

const initialContext: SearchParamsContext = {
  dispatchSearchParams: () => {},
  searchParams: {},
}

const Context = createContext(initialContext)

// TODO: abstract the `next/navigation` dependency out from this provider so that it can be used in other contexts
export const SearchParamsProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const nextSearchParams = useNextSearchParams()
  const router = useRouter()
  const initialParams = qs.parse(nextSearchParams.toString(), {
    depth: 10,
    ignoreQueryPrefix: true,
  })

  const [searchParams, dispatchSearchParams] = React.useReducer((state: State, action: Action) => {
    const stackAction = action.browserHistory || 'push'
    let paramsToSet

    switch (action.type) {
      case 'SET':
        paramsToSet = {
          ...state,
          ...action.params,
        }
        break
      case 'REPLACE':
        paramsToSet = action.params
        break
      case 'CLEAR':
        paramsToSet = {}
        break
      default:
        return state
    }

    const newSearchString = qs.stringify(paramsToSet, { addQueryPrefix: true })
    if (stackAction === 'push') {
      router.push(newSearchString)
    } else if (stackAction === 'replace') {
      router.replace(newSearchString)
    }

    return paramsToSet
  }, initialParams)

  return (
    <Context.Provider value={{ dispatchSearchParams, searchParams }}>{children}</Context.Provider>
  )
}

export const useSearchParams = (): SearchParamsContext => useContext(Context)
