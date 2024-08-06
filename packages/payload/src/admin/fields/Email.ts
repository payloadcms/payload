import type { EmailField } from '../../fields/config/types.js'
import type { EmailFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type EmailFieldProps = {
  autoComplete?: string
  name?: string
  path?: string
  placeholder?: EmailField['admin']['placeholder']
  validate?: EmailFieldValidation
  width?: string
} & Omit<FormFieldBase, 'validate'>

export type EmailFieldLabelComponent = LabelComponent<'email'>

export type EmailFieldDescriptionComponent = DescriptionComponent<'email'>

export type EmailFieldErrorComponent = ErrorComponent<'email'>
