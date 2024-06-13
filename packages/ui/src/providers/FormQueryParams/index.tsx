'use client'

import React, { createContext, useContext } from 'react'

import type { Action, FormQueryParamsContext, State } from './types.js'

import { useLocale } from '../Locale/index.js'

export type * from './types.js'

export const FormQueryParams = createContext({} as FormQueryParamsContext)

export const FormQueryParamsProvider: React.FC<{
  children: React.ReactNode
  initialParams?: State
}> = ({ children, initialParams: formQueryParamsFromProps }) => {
  const [formQueryParams, dispatchFormQueryParams] = React.useReducer(
    (state: State, action: Action) => {
      const newState = { ...state }

      switch (action.type) {
        case 'SET':
          if (action.params?.uploadEdits === null && newState?.uploadEdits) {
            delete newState.uploadEdits
          }
          if (action.params?.uploadEdits?.crop === null && newState?.uploadEdits?.crop) {
            delete newState.uploadEdits.crop
          }
          if (
            action.params?.uploadEdits?.focalPoint === null &&
            newState?.uploadEdits?.focalPoint
          ) {
            delete newState.uploadEdits.focalPoint
          }
          return {
            ...newState,
            ...action.params,
          }
        default:
          return state
      }
    },
    formQueryParamsFromProps || ({} as State),
  )

  const locale = useLocale()

  React.useEffect(() => {
    if (locale?.code) {
      dispatchFormQueryParams({
        type: 'SET',
        params: {
          locale: locale.code,
        },
      })
    }
  }, [locale.code])

  return (
    <FormQueryParams.Provider value={{ dispatchFormQueryParams, formQueryParams }}>
      {children}
    </FormQueryParams.Provider>
  )
}

export const useFormQueryParams = (): {
  dispatchFormQueryParams: React.Dispatch<Action>
  formQueryParams: State
} => useContext(FormQueryParams)
