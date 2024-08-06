import type { Option } from '../../fields/config/types.js'
import type { SelectFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type SelectFieldProps = {
  hasMany?: boolean
  isClearable?: boolean
  isSortable?: boolean
  name?: string
  onChange?: (e: string | string[]) => void
  options?: Option[]
  path?: string
  validate?: SelectFieldValidation
  value?: string
  width?: string
} & Omit<FormFieldBase, 'validate'>

export type SelectFieldLabelComponent = LabelComponent<'select'>

export type SelectFieldDescriptionComponent = DescriptionComponent<'select'>

export type SelectFieldErrorComponent = ErrorComponent<'select'>
