import type { FilterOptionsResult, Row, Validate } from 'payload'

export type Options = {
  disableFormData?: boolean
  hasRows?: boolean
  path: string
  validate?: Validate
}

export type FieldType<T> = {
  errorMessage?: string
  errorPaths?: string[]
  filterOptions?: FilterOptionsResult
  formInitializing: boolean
  formProcessing: boolean
  formSubmitted: boolean
  initialValue?: T
  readOnly?: boolean
  rows?: Row[]
  setValue: (val: unknown, disableModifyingForm?: boolean) => void
  showError: boolean
  valid?: boolean
  value: T
}
