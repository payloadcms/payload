import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type JoinFieldProps = {
  disableModifyingForm?: false
  forceUsePathFromProps?: boolean
  name?: string
  path?: string
  value?: unknown
} & FormFieldBase

export type JoinFieldLabelComponent = LabelComponent<'join'>

export type JoinFieldDescriptionComponent = DescriptionComponent<'join'>

export type JoinFieldErrorComponent = ErrorComponent<'join'>
