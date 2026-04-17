import type { MarkOptional } from 'ts-essentials'

import type { PointField, PointFieldClient } from '../../fields/config/types.js'
import type { PointFieldValidation } from '../../fields/validations.js'
import type { FieldErrorClientComponent, FieldErrorServerComponent } from '../forms/Error.js'
import type {
  ClientFieldBase,
  FieldClientComponent,
  FieldPaths,
  FieldServerComponent,
  ServerFieldBase,
} from '../forms/Field.js'
import type {
  FieldDescriptionClientComponent,
  FieldDescriptionServerComponent,
  FieldDiffClientComponent,
  FieldDiffServerComponent,
  FieldLabelClientComponent,
  FieldLabelServerComponent,
} from '../types.js'

type PointFieldClientWithoutType = MarkOptional<PointFieldClient, 'type'>

type PointFieldBaseClientProps = {
  readonly path: string
  readonly validate?: PointFieldValidation
}

type PointFieldBaseServerProps = Pick<FieldPaths, 'path'>

export type PointFieldClientProps = ClientFieldBase<PointFieldClientWithoutType> &
  PointFieldBaseClientProps

export type PointFieldServerProps = PointFieldBaseServerProps &
  ServerFieldBase<PointField, PointFieldClientWithoutType>

export type PointFieldServerComponent = FieldServerComponent<
  PointField,
  PointFieldClientWithoutType,
  PointFieldBaseServerProps
>

export type PointFieldClientComponent = FieldClientComponent<
  PointFieldClientWithoutType,
  PointFieldBaseClientProps
>

export type PointFieldLabelServerComponent = FieldLabelServerComponent<
  PointField,
  PointFieldClientWithoutType
>

export type PointFieldLabelClientComponent = FieldLabelClientComponent<PointFieldClientWithoutType>

export type PointFieldDescriptionServerComponent = FieldDescriptionServerComponent<
  PointField,
  PointFieldClientWithoutType
>

export type PointFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<PointFieldClientWithoutType>

export type PointFieldErrorServerComponent = FieldErrorServerComponent<
  PointField,
  PointFieldClientWithoutType
>

export type PointFieldErrorClientComponent = FieldErrorClientComponent<PointFieldClientWithoutType>

export type PointFieldDiffServerComponent = FieldDiffServerComponent<PointField, PointFieldClient>

export type PointFieldDiffClientComponent = FieldDiffClientComponent<PointFieldClient>
