import type { MarkOptional } from 'ts-essentials'

import type { DateField, DateFieldClient } from '../../fields/config/types.js'
import type { DateFieldValidation } from '../../fields/validations.js'
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

type DateFieldClientWithoutType = MarkOptional<DateFieldClient, 'type'>

type DateFieldBaseClientProps = {
  readonly path: string
  readonly validate?: DateFieldValidation
}

type DateFieldBaseServerProps = Pick<FieldPaths, 'path'>

export type DateFieldClientProps = ClientFieldBase<DateFieldClientWithoutType> &
  DateFieldBaseClientProps

export type DateFieldServerProps = DateFieldBaseServerProps &
  ServerFieldBase<DateField, DateFieldClientWithoutType>
export type DateFieldLabelServerProps = FieldLabelServerProps<DateField, DateFieldClientWithoutType>

export type DateFieldLabelClientProps = FieldLabelClientProps<DateFieldClientWithoutType>

export type DateFieldDescriptionServerProps = FieldDescriptionServerProps<
  DateField,
  DateFieldClientWithoutType
>

export type DateFieldDescriptionClientProps =
  FieldDescriptionClientProps<DateFieldClientWithoutType>

export type DateFieldErrorServerProps = FieldErrorServerProps<DateField, DateFieldClientWithoutType>

export type DateFieldErrorClientProps = FieldErrorClientProps<DateFieldClientWithoutType>

export type DateFieldDiffServerProps = FieldDiffServerProps<DateField, DateFieldClient>

export type DateFieldDiffClientProps = FieldDiffClientProps<DateFieldClient>
