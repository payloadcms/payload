import type { MarkOptional } from 'ts-essentials'

import type { NumberField, NumberFieldClient } from '../../fields/config/types.js'
import type { NumberFieldValidation } from '../../fields/validations.js'
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

type NumberFieldClientWithoutType = MarkOptional<NumberFieldClient, 'type'>

type NumberFieldBaseClientProps = {
  readonly onChange?: (e: number) => void
  readonly validate?: NumberFieldValidation
}

export type NumberFieldClientProps = ClientFieldBase<NumberFieldClientWithoutType> &
  NumberFieldBaseClientProps

export type NumberFieldServerProps = ServerFieldBase<NumberField>

export type NumberFieldServerComponent = FieldServerComponent<NumberField>

export type NumberFieldClientComponent = FieldClientComponent<
  NumberFieldClientWithoutType,
  NumberFieldBaseClientProps
>

export type NumberFieldLabelServerComponent = FieldLabelServerComponent<NumberField>

export type NumberFieldLabelClientComponent =
  FieldLabelClientComponent<NumberFieldClientWithoutType>

export type NumberFieldDescriptionServerComponent = FieldDescriptionServerComponent<NumberField>

export type NumberFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<NumberFieldClientWithoutType>

export type NumberFieldErrorServerComponent = FieldErrorServerComponent<NumberField>

export type NumberFieldErrorClientComponent =
  FieldErrorClientComponent<NumberFieldClientWithoutType>
