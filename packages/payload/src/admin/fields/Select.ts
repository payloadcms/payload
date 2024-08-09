import type { MarkOptional } from 'ts-essentials'

import type { SelectFieldClient } from '../../fields/config/types.js'
import type { SelectFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type SelectFieldProps = {
  readonly field: MarkOptional<SelectFieldClient, 'type'>
  readonly onChange?: (e: string | string[]) => void
  readonly validate?: SelectFieldValidation
  readonly value?: string
} & Omit<FormFieldBase, 'validate'>

export type SelectFieldLabelComponent = LabelComponent<'select'>

export type SelectFieldDescriptionComponent = DescriptionComponent<'select'>

export type SelectFieldErrorComponent = ErrorComponent<'select'>
