import type {
  ClientField,
  ComponentSlot,
  Data,
  FormField,
  FormState,
  Row,
  TypedUser,
  ValidationFieldError,
} from 'payload'
import type React from 'react'
import type { Dispatch } from 'react'

import type { AcceptValues } from './mergeServerFormState.js'

export type Preferences = {
  [key: string]: unknown
}

export type FormOnSuccess<T = unknown, C = Record<string, unknown>> = (
  json: T,
  ctx?: {
    /**
     * Arbitrary context passed to the onSuccess callback.
     */
    context?: C
    /**
     * The form state that was sent with the request when retrieving the `json` arg.
     */
    formState?: FormState
  },
) => Promise<FormState | void> | void

/**
 * Phase 6: discriminated envelope returned from `onChange` when the
 * dispatch decided that only specific component slots needed re-rendering.
 * The Form reducer routes this through `MERGE_RENDERED_FIELDS` so values,
 * validity, and condition state are not disturbed.
 */
export type RenderedFieldsResult = {
  rendered: Array<{
    path: string
    payload: React.ReactNode
    slot: ComponentSlot
  }>
  type: 'rendered-fields'
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
  onChange?: ((args: {
    /**
     * Phase 6: the most recent form state. Existing consumers passed this as
     * `formState`; the name is preserved for backwards compatibility. The
     * argument is a deep copy with React elements stripped.
     */
    formState: FormState
    /**
     * Phase 6: the previous form state captured before the current change.
     * Required by `decideCall` to detect structural events. Existing consumers
     * may ignore this field — it defaults to the current `formState` for
     * callers that pre-date the dispatch swap.
     */
    prevFormState?: FormState
    /**
     * Phase 6: visibility map computed from the most recent form state.
     * Empty map for fields without path-valued conditions. Required by
     * `decideCall` to detect visibility flips.
     */
    prevVisibility?: Map<string, boolean>
    submitted?: boolean
    /**
     * Phase 6: previous visibility map. Together with `prevVisibility` this
     * gives `decideCall` enough signal to compute newly visible targets.
     */
    visibility?: Map<string, boolean>
  }) => Promise<FormState | RenderedFieldsResult | undefined | void>)[]
  onSubmit?: (fields: FormState, data: Data) => void
  onSuccess?: FormOnSuccess
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

export type SubmitOptions<C = Record<string, unknown>> = {
  acceptValues?: AcceptValues
  action?: string
  /**
   * If you want to pass additional data to the onSuccess callback, you can use this context object.
   *
   * @experimental This property is experimental and may change in the future.
   */
  context?: C
  /**
   * When true, will disable the form while it is processing.
   * @default true
   */
  disableFormWhileProcessing?: boolean
  /**
   * When true, will disable the success toast after form submission.
   * @default false
   */
  disableSuccessStatus?: boolean
  method?: string
  overrides?: ((formState) => FormData) | Record<string, unknown>
  /**
   * When true, will skip validation before submitting the form.
   * @default false
   */
  skipValidation?: boolean
}

export type DispatchFields = React.Dispatch<any>

export type Submit = <T extends Response, C extends Record<string, unknown>>(
  options?: SubmitOptions<C>,
  e?: React.FormEvent<HTMLFormElement>,
) => Promise</**
 * Returns the form state and the response from the server.
 *
 * @experimental - Note: the `{ res: ... }` return type is experimental and may change in the future. Use at your own risk.
 */
{ formState?: FormState; res: T } | void>

export type ValidateForm = () => Promise<boolean>

export type CreateFormData = (
  overrides?: Record<string, unknown>,
  /**
   * If mergeOverrideData true, the data will be merged with the existing data in the form state.
   * @default true
   */
  options?: {
    /**
     * If provided, will use this instead of of derived data from the current form state.
     */
    data?: Data
    mergeOverrideData?: boolean
  },
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
  user: TypedUser
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
  /**
   * Phase 13.x: pre-mounted client Field components for this new row,
   * keyed by the sub-path relative to the row (e.g. `text` for the row
   * field at `array.0.text`). Each entry is a `customComponents` bag in
   * the form-state shape; the reducer writes them into the new row's
   * flat field-state entries so the first paint shows the user's custom
   * client component instead of the default field. Built sync by
   * `addFieldRow` against a pre-warmed import registry — server-
   * classified Fields still go through the renderFields roundtrip.
   */
  clientCustomComponents?: Record<string, { Field?: React.ReactNode }>
  /**
   * Phase 13.x: when true, the new row's schema includes at least one
   * server-classified custom Field component under it. The reducer marks
   * the row `isLoading: true` so the array UI shows a ShimmerEffect
   * placeholder until `MERGE_RENDERED_FIELDS` lands the rendered server
   * payload. Default false (no shimmer flash for default + client rows).
   */
  hasServerField?: boolean
  path: string
  rowIndex?: number
  subFieldState?: FormState
  type: 'ADD_ROW'
}

export type MERGE_SERVER_STATE = {
  acceptValues?: AcceptValues
  prevStateRef: React.RefObject<FormState>
  serverState: FormState
  type: 'MERGE_SERVER_STATE'
}

/**
 * Phase 6: payload-only merge action used by the client-side dispatch
 * swap. The `renderFields` server function returns React elements; this
 * action writes them into the addressed `customComponents` slots without
 * touching values, validity, or condition state. Slot keys arrive as the
 * lowercase `ComponentSlot` enum and are translated to the Pascal-cased
 * `customComponents` keys on apply.
 */
export type MERGE_RENDERED_FIELDS = {
  rendered: Array<{
    path: string
    payload: React.ReactNode
    slot: ComponentSlot
  }>
  type: 'MERGE_RENDERED_FIELDS'
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
  | MERGE_RENDERED_FIELDS
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
