import type { DateField } from '../../fields/config/types.js'
import type { DateFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type DateFieldProps = {
  date?: DateField['admin']['date']
  name?: string
  path?: string
  placeholder?: DateField['admin']['placeholder'] | string
  validate?: DateFieldValidation
  width?: string
} & Omit<FormFieldBase, 'validate'>

export type DateFieldLabelComponent = LabelComponent<'date'>

export type DateFieldDescriptionComponent = DescriptionComponent<'date'>

export type DateFieldErrorComponent = ErrorComponent<'date'>
