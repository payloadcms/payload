import type { FieldState, Validate } from '@ruya.sa/payload'

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
   * Custom server components receive a static `path` prop at render-time, leading to temporarily stale paths when re-ordering rows in form state.
   * This is because when manipulating rows, field paths change in form state, but the prop remains the same until the component is re-rendered on the server.
   * This causes the component to temporarily point to the wrong field in form state until the server responds with a freshly rendered component.
   * To prevent this, fields are wrapped with a `FieldPathContext` which is guaranteed to be up-to-date.
   * The `path` prop that Payload's default fields receive, then, are sent into this hook as the `potentiallyStalePath` arg.
   * This ensures that:
   *   1. Custom components that use this hook directly will still respect the `path` prop as top priority.
   *   2. Custom server components that blindly spread their props into default Payload fields still prefer the dynamic path from context.
   *   3. Components that render default Payload fields directly do not require a `FieldPathProvider`, e.g. the email field in the account view.
   */
  potentiallyStalePath?: string
  /**
   * Client-side validation function fired when the form is submitted.
   */
  validate?: Validate
}

export type FieldType<T> = {
  disabled: boolean
  formInitializing: boolean
  formProcessing: boolean
  formSubmitted: boolean
  initialValue?: T
  path: string
  /**
   * @deprecated - readOnly is no longer returned from useField. Remove this in 4.0.
   */
  readOnly?: boolean
  setValue: (val: unknown, disableModifyingForm?: boolean) => void
  showError: boolean
  value: T
} & Pick<
  FieldState,
  | 'blocksFilterOptions'
  | 'customComponents'
  | 'errorMessage'
  | 'errorPaths'
  | 'filterOptions'
  | 'rows'
  | 'selectFilterOptions'
  | 'valid'
>
