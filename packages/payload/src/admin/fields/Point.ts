import type { MarkOptional } from 'ts-essentials'

import type { PointField, PointFieldClient } from '../../fields/config/types.js'
import type { PointFieldValidation } from '../../fields/validations.js'
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

type PointFieldClientWithoutType = MarkOptional<PointFieldClient, 'type'>

type PointFieldBaseClientProps = {
  readonly validate?: PointFieldValidation
}

export type PointFieldClientProps = ClientFieldBase<PointFieldClientWithoutType> &
  PointFieldBaseClientProps

export type PointFieldServerProps = ServerFieldBase<PointField>

export type PointFieldServerComponent = FieldServerComponent<PointField>

export type PointFieldClientComponent = FieldClientComponent<
  PointFieldClientWithoutType,
  PointFieldBaseClientProps
>

export type PointFieldLabelServerComponent = FieldLabelServerComponent<PointField>

export type PointFieldLabelClientComponent = FieldLabelClientComponent<PointFieldClientWithoutType>

export type PointFieldDescriptionServerComponent = FieldDescriptionServerComponent<PointField>

export type PointFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<PointFieldClientWithoutType>

export type PointFieldErrorServerComponent = FieldErrorServerComponent<PointField>

export type PointFieldErrorClientComponent = FieldErrorClientComponent<PointFieldClientWithoutType>
