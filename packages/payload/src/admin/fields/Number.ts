import type { MarkOptional } from 'ts-essentials'

import type { NumberFieldClient } from '../../fields/config/types.js'
import type { NumberFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

type NumberFieldClientWithoutType = MarkOptional<NumberFieldClient, 'type'>

export type NumberFieldProps = {
  readonly onChange?: (e: number) => void
  readonly validate?: NumberFieldValidation
} & Omit<FormFieldBase<NumberFieldClientWithoutType>, 'validate'>

export type NumberFieldLabelComponent = LabelComponent<NumberFieldClientWithoutType>

export type NumberFieldDescriptionComponent = DescriptionComponent<NumberFieldClientWithoutType>

export type NumberFieldErrorComponent = ErrorComponent<NumberFieldClientWithoutType>
