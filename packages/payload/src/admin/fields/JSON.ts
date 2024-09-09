import type { MarkOptional } from 'ts-essentials'

import type { JSONField, JSONFieldClient } from '../../fields/config/types.js'
import type { JSONFieldValidation } from '../../fields/validations.js'
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

type JSONFieldClientWithoutType = MarkOptional<JSONFieldClient, 'type'>

type JSONFieldBaseClientProps = {
  readonly validate?: JSONFieldValidation
}

export type JSONFieldClientProps = ClientFieldBase<JSONFieldClientWithoutType> &
  JSONFieldBaseClientProps

export type JSONFieldServerProps = ServerFieldBase<JSONField>

export type JSONFieldServerComponent = FieldServerComponent<JSONField>

export type JSONFieldClientComponent = FieldClientComponent<
  JSONFieldClientWithoutType,
  JSONFieldBaseClientProps
>

export type JSONFieldLabelServerComponent = FieldLabelServerComponent<JSONField>

export type JSONFieldLabelClientComponent = FieldLabelClientComponent<JSONFieldClientWithoutType>

export type JSONFieldDescriptionServerComponent = FieldDescriptionServerComponent<JSONField>

export type JSONFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<JSONFieldClientWithoutType>

export type JSONFieldErrorServerComponent = FieldErrorServerComponent<JSONField>

export type JSONFieldErrorClientComponent = FieldErrorClientComponent<JSONFieldClientWithoutType>
