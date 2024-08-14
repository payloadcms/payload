import type { MarkOptional } from 'ts-essentials'

import type { NumberFieldClient } from '../../fields/config/types.js'
import type { NumberFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type NumberFieldProps = {
  readonly field: MarkOptional<NumberFieldClient, 'type'>
  readonly onChange?: (e: number) => void
  readonly validate?: NumberFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type NumberFieldLabelComponent = LabelComponent<'number'>

export type NumberFieldDescriptionComponent = DescriptionComponent<'number'>

export type NumberFieldErrorComponent = ErrorComponent<'number'>
