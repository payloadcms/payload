import type { MarkOptional } from 'ts-essentials'

import type { JSONFieldClient } from '../../fields/config/types.js'
import type { JSONFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type JSONFieldProps = {
  readonly field: MarkOptional<JSONFieldClient, 'type'>
  readonly validate?: JSONFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type JSONFieldLabelComponent = LabelComponent<'json'>

export type JSONFieldDescriptionComponent = DescriptionComponent<'json'>

export type JSONFieldErrorComponent = ErrorComponent<'json'>
