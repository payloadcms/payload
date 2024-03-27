import type { User } from 'payload/auth'
import type { Field, FormField, FormState } from 'payload/types'
import type { Data } from 'payload/types'
import type React from 'react'
import type { Dispatch } from 'react'

export type Preferences = {
  [key: string]: unknown
}

export type FormProps = (
  | {
      action: (formData: FormData) => Promise<void>
    }
  | {
      action?: string
      method?: 'DELETE' | 'GET' | 'PATCH' | 'POST'
    }
) & {
  beforeSubmit?: ((args: { formState: FormState }) => Promise<FormState>)[]
  children?: React.ReactNode
  className?: string
  disableSuccessStatus?: boolean
  disabled?: boolean
  /**
   * By default, the form will get the field schema (not data) from the current document. If you pass this in, you can override that behavior.
   * This is very useful for sub-forms, where the form's field schema is not necessarily the field schema of the current document (e.g. for the Blocks
   * feature of the Lexical Rich Text field)
   */
  fields?: Field[]
  handleResponse?: (res: Response) => void
  initialState?: FormState
  log?: boolean
  onChange?: ((args: { formState: FormState }) => Promise<FormState>)[]
  onSubmit?: (fields: FormState, data: Data) => void
  onSuccess?: (json: unknown) => void
  redirect?: string
  submitted?: boolean
  uuid?: string
  validationOperation?: 'create' | 'update'
  waitForAutocomplete?: boolean
}

export type SubmitOptions = {
  action?: string
  method?: string
  overrides?: Record<string, unknown>
  skipValidation?: boolean
}

export type DispatchFields = React.Dispatch<any>
export type Submit = (
  options?: SubmitOptions,
  e?: React.FormEvent<HTMLFormElement>,
) => Promise<void>
export type ValidateForm = () => Promise<boolean>
export type CreateFormData = (overrides?: any) => FormData
export type GetFields = () => FormState
export type GetField = (path: string) => FormField
export type GetData = () => Data
export type GetSiblingData = (path: string) => Data
export type GetDataByPath = <T = unknown>(path: string) => T
export type SetModified = (modified: boolean) => void
export type SetSubmitted = (submitted: boolean) => void
export type SetProcessing = (processing: boolean) => void

export type Reset = (data: unknown) => Promise<void>

export type REPLACE_STATE = {
  optimize?: boolean
  state: FormState
  type: 'REPLACE_STATE'
}

export type REMOVE = {
  path: string
  type: 'REMOVE'
}

export type MODIFY_CONDITION = {
  path: string
  result: boolean
  type: 'MODIFY_CONDITION'
  user: User
}

export type UPDATE = {
  path: string
  type: 'UPDATE'
} & Partial<FormField>

export type REMOVE_ROW = {
  path: string
  rowIndex: number
  type: 'REMOVE_ROW'
}

export type ADD_ROW = {
  blockType?: string
  path: string
  rowIndex?: number
  subFieldState?: FormState
  type: 'ADD_ROW'
}

export type REPLACE_ROW = {
  blockType?: string
  path: string
  rowIndex: number
  subFieldState?: FormState
  type: 'REPLACE_ROW'
}

export type DUPLICATE_ROW = {
  path: string
  rowIndex: number
  type: 'DUPLICATE_ROW'
}

export type MOVE_ROW = {
  moveFromIndex: number
  moveToIndex: number
  path: string
  type: 'MOVE_ROW'
}

export type SET_ROW_COLLAPSED = {
  collapsed: boolean
  path: string
  rowID: string
  setDocFieldPreferences: (field: string, fieldPreferences: { [key: string]: unknown }) => void
  type: 'SET_ROW_COLLAPSED'
}

export type SET_ALL_ROWS_COLLAPSED = {
  collapsed: boolean
  path: string
  setDocFieldPreferences: (field: string, fieldPreferences: { [key: string]: unknown }) => void
  type: 'SET_ALL_ROWS_COLLAPSED'
}

export type FieldAction =
  | ADD_ROW
  | DUPLICATE_ROW
  | MODIFY_CONDITION
  | MOVE_ROW
  | REMOVE
  | REMOVE_ROW
  | REPLACE_ROW
  | REPLACE_STATE
  | SET_ALL_ROWS_COLLAPSED
  | SET_ROW_COLLAPSED
  | UPDATE

export type FormFieldsContext = [FormState, Dispatch<FieldAction>]

export type Context = {
  addFieldRow: ({
    data,
    path,
    rowIndex,
    schemaPath,
  }: {
    data?: Data
    path: string
    /*
     * by default the new row will be added to the end of the list
     */
    rowIndex?: number
    schemaPath: string
  }) => Promise<void>
  buildRowErrors: () => void
  createFormData: CreateFormData
  disabled: boolean
  dispatchFields: Dispatch<FieldAction>
  /**
   * Form context fields may be outdated and should not be relied on. Instead, prefer `useFormFields`.
   */
  fields: FormState
  formRef: React.MutableRefObject<HTMLFormElement>
  getData: GetData
  getDataByPath: GetDataByPath
  getField: GetField
  getFields: GetFields
  getSiblingData: GetSiblingData
  removeFieldRow: ({ path, rowIndex }: { path: string; rowIndex: number }) => void
  replaceFieldRow: ({
    data,
    path,
    rowIndex,
    schemaPath,
  }: {
    data?: Data
    path: string
    rowIndex: number
    schemaPath: string
  }) => Promise<void>
  replaceState: (state: FormState) => void
  reset: Reset
  setModified: SetModified
  setProcessing: SetProcessing
  setSubmitted: SetSubmitted
  submit: Submit
  uuid?: string
  validateForm: ValidateForm
}
