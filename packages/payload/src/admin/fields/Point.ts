import type { MarkOptional } from 'ts-essentials'

import type { PointField, PointFieldClient } from '../../fields/config/types.js'
import type { PointFieldValidation } from '../../fields/validations.js'
import type { FieldErrorClientProps, FieldErrorServerProps } from '../forms/Error.js'
import type { ClientFieldBase, FieldPaths, ServerFieldBase } from '../forms/Field.js'
import type {
  FieldDescriptionClientProps,
  FieldDescriptionServerProps,
  FieldDiffClientProps,
  FieldDiffServerProps,
  FieldLabelClientProps,
  FieldLabelServerProps,
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
export type PointFieldLabelServerProps = FieldLabelServerProps<
  PointField,
  PointFieldClientWithoutType
>

export type PointFieldLabelClientProps = FieldLabelClientProps<PointFieldClientWithoutType>

export type PointFieldDescriptionServerProps = FieldDescriptionServerProps<
  PointField,
  PointFieldClientWithoutType
>

export type PointFieldDescriptionClientProps =
  FieldDescriptionClientProps<PointFieldClientWithoutType>

export type PointFieldErrorServerProps = FieldErrorServerProps<
  PointField,
  PointFieldClientWithoutType
>

export type PointFieldErrorClientProps = FieldErrorClientProps<PointFieldClientWithoutType>

export type PointFieldDiffServerProps = FieldDiffServerProps<PointField, PointFieldClient>

export type PointFieldDiffClientProps = FieldDiffClientProps<PointFieldClient>
