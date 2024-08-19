import type { MarkOptional } from 'ts-essentials'

import type { DateFieldClient } from '../../fields/config/types.js'
import type { DateFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

type DateFieldClientWithoutType = MarkOptional<DateFieldClient, 'type'>

export type DateFieldProps = {
  readonly validate?: DateFieldValidation
} & Omit<FormFieldBase<DateFieldClientWithoutType>, 'validate'>

export type DateFieldLabelComponent = LabelComponent<DateFieldClientWithoutType>

export type DateFieldDescriptionComponent = DescriptionComponent<DateFieldClientWithoutType>

export type DateFieldErrorComponent = ErrorComponent<DateFieldClientWithoutType>
