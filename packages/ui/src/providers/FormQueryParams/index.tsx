'use client'
import React, { createContext, useContext, useState } from 'react'

import type { UploadEdits } from '../../views/Edit/types'

export type QueryParamTypes = {
  depth: number
  'fallback-locale': string
  locale: string
  uploadEdits?: UploadEdits
}
export const FormQueryParams = createContext(
  {} as {
    formQueryParams: QueryParamTypes
    setFormQueryParams: (params: QueryParamTypes) => void
  },
)

export const FormQueryParamsProvider: React.FC<{
  children: React.ReactNode
  formQueryParams?: QueryParamTypes
  setFormQueryParams?: (params: QueryParamTypes) => void
}> = ({ children, formQueryParams: formQueryParamsFromProps }) => {
  const [formQueryParams, setFormQueryParams] = useState(
    formQueryParamsFromProps || ({} as QueryParamTypes),
  )

  return (
    <FormQueryParams.Provider value={{ formQueryParams, setFormQueryParams }}>
      {children}
    </FormQueryParams.Provider>
  )
}

export const useFormQueryParams = (): {
  formQueryParams: QueryParamTypes
  setFormQueryParams: (params: QueryParamTypes) => void
} => useContext(FormQueryParams)
