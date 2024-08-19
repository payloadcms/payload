import type { MarkOptional } from 'ts-essentials'

import type { JSONFieldClient } from '../../fields/config/types.js'
import type { JSONFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

type JSONFieldClientWithoutType = MarkOptional<JSONFieldClient, 'type'>

export type JSONFieldProps = {
  readonly validate?: JSONFieldValidation
} & Omit<FormFieldBase<JSONFieldClientWithoutType>, 'validate'>

export type JSONFieldLabelComponent = LabelComponent<JSONFieldClientWithoutType>

export type JSONFieldDescriptionComponent = DescriptionComponent<JSONFieldClientWithoutType>

export type JSONFieldErrorComponent = ErrorComponent<JSONFieldClientWithoutType>
