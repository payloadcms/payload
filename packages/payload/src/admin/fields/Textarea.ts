import type { TextareaField } from '../../fields/config/types.js'
import type { TextareaFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type TextareaFieldProps = {
  maxLength?: number
  minLength?: number
  name?: string
  path?: string
  placeholder?: TextareaField['admin']['placeholder']
  rows?: number
  validate?: TextareaFieldValidation
  width?: string
} & Omit<FormFieldBase, 'validate'>

export type TextareaFieldLabelComponent = LabelComponent<'textarea'>

export type TextareaFieldDescriptionComponent = DescriptionComponent<'textarea'>

export type TextareaFieldErrorComponent = ErrorComponent<'textarea'>
