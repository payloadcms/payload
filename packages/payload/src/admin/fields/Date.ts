import type { MarkOptional } from 'ts-essentials'

import type { DateField, DateFieldClient } from '../../fields/config/types.js'
import type { DateFieldValidation } from '../../fields/validations.js'
import type { FieldErrorClientComponent, FieldErrorServerComponent } from '../forms/Error.js'
import type {
  ClientFieldBase,
  FieldClientComponent,
  FieldServerComponent,
  ServerFieldBase,
} from '../forms/Field.js'
import type {
  FieldDescriptionClientComponent,
  FieldDescriptionServerComponent,
  FieldLabelClientComponent,
  FieldLabelServerComponent,
} from '../types.js'

type DateFieldClientWithoutType = MarkOptional<DateFieldClient, 'type'>

type DateFieldBaseClientProps = {
  readonly validate?: DateFieldValidation
}

export type DateFieldClientProps = ClientFieldBase<DateFieldClientWithoutType> &
  DateFieldBaseClientProps

export type DateFieldServerProps = ServerFieldBase<DateField>

export type DateFieldServerComponent = FieldServerComponent<DateField>

export type DateFieldClientComponent = FieldClientComponent<
  DateFieldClientWithoutType,
  DateFieldBaseClientProps
>

export type DateFieldLabelServerComponent = FieldLabelServerComponent<DateField>

export type DateFieldLabelClientComponent = FieldLabelClientComponent<DateFieldClientWithoutType>

export type DateFieldDescriptionServerComponent = FieldDescriptionServerComponent<DateField>

export type DateFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<DateFieldClientWithoutType>

export type DateFieldErrorServerComponent = FieldErrorServerComponent<DateField>

export type DateFieldErrorClientComponent = FieldErrorClientComponent<DateFieldClientWithoutType>
