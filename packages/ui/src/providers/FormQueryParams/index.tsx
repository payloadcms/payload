import { createContext, useContext } from 'react'

import type { UploadEdits } from '../../views/collections/Edit/types'

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

export const useFormQueryParams = (): {
  formQueryParams: QueryParamTypes
  setFormQueryParams: (params: QueryParamTypes) => void
} => useContext(FormQueryParams)
