import type {
  ClientField,
  Data,
  FormField,
  FormState,
  Row,
  User,
  ValidationFieldError,
} from 'payload'
import type React from 'react'
import type { Dispatch } from 'react'

export type Preferences = {
  [key: string]: unknown
}

export type FormProps = {
  beforeSubmit?: ((args: { formState: FormState }) => Promise<FormState>)[]
  children?: React.ReactNode
  className?: string
  disabled?: boolean
  disableSuccessStatus?: boolean
  /**
   * If you would like to solely leverage server-side validation on submit,
   * you can disable checks that the form makes before it submits
   */
  disableValidationOnSubmit?: boolean
  /**
   * If you don't want the form to be a <form> element, you can pass a string here to use as the wrapper element.
   */
  el?: string
  /**
   * By default, the form will get the field schema (not data) from the current document. If you pass this in, you can override that behavior.
   * This is very useful for sub-forms, where the form's field schema is not necessarily the field schema of the current document (e.g. for the Blocks
   * feature of the Lexical Rich Text field)
   */
  fields?: ClientField[]
  handleResponse?: (
    res: Response,
    successToast: (value: string) => void,
    errorToast: (value: string) => void,
  ) => void
  initialState?: FormState
  /**
   * Determines if this Form is the main, top-level Form of a document. If set to true, the
   * Form's children will be wrapped in a DocumentFormContext, which lets you access this document
   * Form's data and fields from any child component - even if that child component is wrapped in a child
   * Form (e.g. a lexical block).
   */
  isDocumentForm?: boolean
  isInitializing?: boolean
  log?: boolean
  onChange?: ((args: { formState: FormState; submitted?: boolean }) => Promise<FormState>)[]
  onSubmit?: (fields: FormState, data: Data) => void
  onSuccess?: (json: unknown) => Promise<FormState | void> | void
  redirect?: string
  submitted?: boolean
  uuid?: string
  validationOperation?: 'create' | 'update'
  waitForAutocomplete?: boolean
} & (
  | {
      action: (formData: FormData) => Promise<void>
    }
  | {
      action?: string
      method?: 'DELETE' | 'GET' | 'PATCH' | 'POST'
    }
)

export type SubmitOptions = {
  action?: string
  method?: string
  overrides?: ((formState) => FormData) | Record<string, unknown>
  skipValidation?: boolean
}

export type DispatchFields = React.Dispatch<any>
export type Submit = (
  options?: SubmitOptions,
  e?: React.FormEvent<HTMLFormElement>,
) => Promise<void>

export type ValidateForm = () => Promise<boolean>

export type CreateFormData = (
  overrides?: Record<string, unknown>,
  /**
   * If mergeOverrideData true, the data will be merged with the existing data in the form state.
   * @default true
   */
  options?: { mergeOverrideData?: boolean },
) => FormData | Promise<FormData>

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
  /**
   * If `sanitize` is true, default values will be set for form field properties that are not present in the incoming state.
   * For example, `valid` will be set to true if it is not present in the incoming state.
   */
  sanitize?: boolean
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

export type UPDATE_MANY = {
  formState: FormState
  type: 'UPDATE_MANY'
}

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

export type MERGE_SERVER_STATE = {
  acceptValues?: boolean
  prevStateRef: React.RefObject<FormState>
  serverState: FormState
  type: 'MERGE_SERVER_STATE'
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

export type ADD_SERVER_ERRORS = {
  errors: ValidationFieldError[]
  type: 'ADD_SERVER_ERRORS'
}

export type SET_ROW_COLLAPSED = {
  path: string
  type: 'SET_ROW_COLLAPSED'
  updatedRows: Row[]
}

export type SET_ALL_ROWS_COLLAPSED = {
  path: string
  type: 'SET_ALL_ROWS_COLLAPSED'
  updatedRows: Row[]
}

export type FieldAction =
  | ADD_ROW
  | ADD_SERVER_ERRORS
  | DUPLICATE_ROW
  | MERGE_SERVER_STATE
  | MODIFY_CONDITION
  | MOVE_ROW
  | REMOVE
  | REMOVE_ROW
  | REPLACE_ROW
  | REPLACE_STATE
  | SET_ALL_ROWS_COLLAPSED
  | SET_ROW_COLLAPSED
  | UPDATE
  | UPDATE_MANY

export type FormFieldsContext = [FormState, Dispatch<FieldAction>]

export type Context = {
  addFieldRow: ({
    blockType,
    path,
    rowIndex,
    schemaPath,
    subFieldState,
  }: {
    blockType?: string
    path: string
    rowIndex?: number
    schemaPath: string
    subFieldState?: FormState
  }) => void
  buildRowErrors: () => void
  createFormData: CreateFormData
  disabled: boolean
  dispatchFields: Dispatch<FieldAction>
  /**
   * Form context fields may be outdated and should not be relied on. Instead, prefer `useFormFields`.
   */
  fields: FormState
  formRef: React.RefObject<HTMLFormElement>
  getData: GetData
  getDataByPath: GetDataByPath
  getField: GetField
  getFields: GetFields
  getSiblingData: GetSiblingData
  initializing: boolean
  /**
   * Tracks wether the form state passes validation.
   * For example the state could be submitted but invalid as field errors have been returned.
   */
  isValid: boolean
  moveFieldRow: ({
    moveFromIndex,
    moveToIndex,
    path,
  }: {
    moveFromIndex: number
    moveToIndex: number
    path: string
  }) => void
  removeFieldRow: ({ path, rowIndex }: { path: string; rowIndex: number }) => void
  replaceFieldRow: ({
    blockType,
    path,
    rowIndex,
    schemaPath,
    subFieldState,
  }: {
    blockType?: string
    path: string
    rowIndex: number
    schemaPath: string
    subFieldState?: FormState
  }) => void
  replaceState: (state: FormState) => void
  reset: Reset
  /**
   * If the form has started processing in the background (e.g.
   * if autosave is running), this will be true.
   */
  setBackgroundProcessing: SetProcessing
  setDisabled: (disabled: boolean) => void
  setIsValid: (processing: boolean) => void
  setModified: SetModified
  setProcessing: SetProcessing
  setSubmitted: SetSubmitted
  submit: Submit
  uuid?: string
  validateForm: ValidateForm
}
