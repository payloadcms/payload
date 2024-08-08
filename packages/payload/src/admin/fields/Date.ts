import type { MarkOptional } from 'ts-essentials'

import type { DateFieldClient } from '../../fields/config/types.js'
import type { DateFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type DateFieldProps = {
  readonly field: MarkOptional<DateFieldClient, 'type'>
  readonly validate?: DateFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type DateFieldLabelComponent = LabelComponent<'date'>

export type DateFieldDescriptionComponent = DescriptionComponent<'date'>

export type DateFieldErrorComponent = ErrorComponent<'date'>
