import type { FieldPermissions, FilterOptionsResult, Row, Validate } from 'payload'

export type Options = {
  disableFormData?: boolean
  hasRows?: boolean
  /**
   * If you do not provide a `path` or a `name`, this hook will look for one using the `useFieldProps` hook.
   **/
  path?: string
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
  path: string
  permissions: FieldPermissions
  readOnly?: boolean
  rows?: Row[]
  schemaPath: string
  setValue: (val: unknown, disableModifyingForm?: boolean) => void
  showError: boolean
  valid?: boolean
  value: T
}
