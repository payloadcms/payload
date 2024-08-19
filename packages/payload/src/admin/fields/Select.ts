import type { MarkOptional } from 'ts-essentials'

import type { SelectFieldClient } from '../../fields/config/types.js'
import type { SelectFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

type SelectFieldClientWithoutType = MarkOptional<SelectFieldClient, 'type'>

export type SelectFieldProps = {
  readonly onChange?: (e: string | string[]) => void
  readonly validate?: SelectFieldValidation
  readonly value?: string
} & Omit<FormFieldBase<SelectFieldClientWithoutType>, 'validate'>

export type SelectFieldLabelComponent = LabelComponent<SelectFieldClientWithoutType>

export type SelectFieldDescriptionComponent = DescriptionComponent<SelectFieldClientWithoutType>

export type SelectFieldErrorComponent = ErrorComponent<SelectFieldClientWithoutType>
