import type { MarkOptional } from 'ts-essentials'

import type { ArrayField, ArrayFieldClient } from '../../fields/config/types.js'
import type { ArrayFieldValidation } from '../../fields/validations.js'
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
  MappedComponent,
} from '../types.js'

type ArrayFieldClientWithoutType = MarkOptional<ArrayFieldClient, 'type'>

type ArrayFieldBaseClientProps = {
  readonly CustomRowLabel?: MappedComponent
  readonly validate?: ArrayFieldValidation
}

export type ArrayFieldClientProps = ArrayFieldBaseClientProps &
  ClientFieldBase<ArrayFieldClientWithoutType>

export type ArrayFieldServerProps = ServerFieldBase<ArrayField>

export type ArrayFieldServerComponent = FieldServerComponent<ArrayField>

export type ArrayFieldClientComponent = FieldClientComponent<
  ArrayFieldClientWithoutType,
  ArrayFieldBaseClientProps
>

export type ArrayFieldLabelServerComponent = FieldLabelServerComponent<ArrayField>

export type ArrayFieldLabelClientComponent = FieldLabelClientComponent<ArrayFieldClientWithoutType>

export type ArrayFieldDescriptionServerComponent = FieldDescriptionServerComponent<ArrayField>

export type ArrayFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<ArrayFieldClientWithoutType>

export type ArrayFieldErrorServerComponent = FieldErrorServerComponent<ArrayField>

export type ArrayFieldErrorClientComponent = FieldErrorClientComponent<ArrayFieldClientWithoutType>
