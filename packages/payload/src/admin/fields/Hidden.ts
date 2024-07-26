import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type HiddenFieldProps = {
  disableModifyingForm?: false
  forceUsePathFromProps?: boolean
  name?: string
  path?: string
  value?: unknown
} & FormFieldBase

export type HiddenFieldLabelComponent = LabelComponent<'hidden'>

export type HiddenFieldDescriptionComponent = DescriptionComponent<'hidden'>

export type HiddenFieldErrorComponent = ErrorComponent<'hidden'>
