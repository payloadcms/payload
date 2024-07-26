import type { FormFieldBase } from '../types.js'

export type CheckboxFieldProps = {
  checked?: boolean
  disableFormData?: boolean
  id?: string
  name?: string
  onChange?: (val: boolean) => void
  partialChecked?: boolean
  path?: string
  type?: 'checkbox'
  width?: string
} & FormFieldBase
