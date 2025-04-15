import type { FieldState, FilterOptionsResult, Row, Validate } from 'payload'

export type Options = {
  disableFormData?: boolean
  hasRows?: boolean
  /**
   * If `path` is provided to this hook, it will be used outright. This is useful when calling this hook directly within a custom component.
   * Otherwise, the field will attempt to get the path from the `FieldPathContext` via the `useFieldPath` hook.
   * If still not found, the `potentiallyStalePath` arg will be used. See the note below about why this is important.
   */
  path?: string
  /**
   * Custom server components receive a static `path` prop at render-time, causing them to become temporarily stale when re-ordering rows in form state.
   * This is because when manipulating rows, field paths change in form state, but the prop remains the same until the component is re-rendered.
   * This causes the component to temporarily point to the wrong field in form state until the server responds with a freshly rendered component.
   * To prevent this, fields are wrapped with a `FieldPathContext` which is guaranteed to be up-to-date.
   * The `path` prop that Payload's default fields receive, then, are sent into this hook as the `potentiallyStalePath` arg.
   * This ensures that default fields prefer the dynamic path from context, while still allowing custom components to render fields without a `FieldPathContext`.
   */
  potentiallyStalePath?: string
  /**
   * Client-side validation function fired when the form is submitted.
   */
  validate?: Validate
}

export type FieldType<T> = {
  customComponents?: FieldState['customComponents']
  disabled: boolean
  errorMessage?: string
  errorPaths?: string[]
  filterOptions?: FilterOptionsResult
  formInitializing: boolean
  formProcessing: boolean
  formSubmitted: boolean
  initialValue?: T
  path: string
  readOnly?: boolean
  rows?: Row[]
  setValue: (val: unknown, disableModifyingForm?: boolean) => void
  showError: boolean
  valid?: boolean
  value: T
}
