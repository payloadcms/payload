import type { FormFieldBase } from '../types.js'

export type HiddenFieldProps = {
  disableModifyingForm?: false
  forceUsePathFromProps?: boolean
  name?: string
  path?: string
  type?: 'hidden'
  value?: unknown
} & FormFieldBase
