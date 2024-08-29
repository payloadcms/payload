import type { MarkOptional } from 'ts-essentials'

import type { RadioField, RadioFieldClient } from '../../fields/config/types.js'
import type { RadioFieldValidation } from '../../fields/validations.js'
import type { FieldErrorClientComponent, FieldErrorServerComponent } from '../forms/Error.js'
import type {
  FieldDescriptionClientComponent,
  FieldDescriptionServerComponent,
  FieldLabelClientComponent,
  FieldLabelServerComponent,
  FormFieldBase,
} from '../types.js'

type RadioFieldClientWithoutType = MarkOptional<RadioFieldClient, 'type'>

export type RadioFieldProps = {
  readonly onChange?: OnChange
  readonly validate?: RadioFieldValidation
  readonly value?: string
} & Omit<FormFieldBase<RadioFieldClientWithoutType>, 'validate'>

export type OnChange<T = string> = (value: T) => void

export type RadioFieldLabelServerComponent = FieldLabelServerComponent<RadioField>

export type RadioFieldLabelClientComponent = FieldLabelClientComponent<RadioFieldClientWithoutType>

export type RadioFieldDescriptionServerComponent = FieldDescriptionServerComponent<RadioField>

export type RadioFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<RadioFieldClientWithoutType>

export type RadioFieldErrorServerComponent = FieldErrorServerComponent<RadioField>

export type RadioFieldErrorClientComponent = FieldErrorClientComponent<RadioFieldClientWithoutType>
