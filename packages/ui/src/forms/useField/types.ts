import type { ClientValidate, FieldPermissions, Row } from 'payload/types'

export type Options = {
  disableFormData?: boolean
  hasRows?: boolean
  /**
   * If you do not provide a `path` or a `name`, this hook will look for one using the `useFieldPath` hook.
   **/
  path?: string
  validate?: ClientValidate
}

export type FieldType<T> = {
  errorMessage?: string
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
