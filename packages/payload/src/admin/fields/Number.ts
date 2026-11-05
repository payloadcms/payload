import type { MarkOptional } from 'ts-essentials'

import type { NumberField, NumberFieldClient } from '../../fields/config/types.js'
import type { NumberFieldValidation } from '../../fields/validations.js'
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

type NumberFieldClientWithoutType = MarkOptional<NumberFieldClient, 'type'>

type NumberFieldBaseClientProps = {
  readonly onChange?: (e: number) => void
  readonly path: string
  readonly validate?: NumberFieldValidation
}

type NumberFieldBaseServerProps = Pick<FieldPaths, 'path'>

export type NumberFieldClientProps = ClientFieldBase<NumberFieldClientWithoutType> &
  NumberFieldBaseClientProps

export type NumberFieldServerProps = NumberFieldBaseServerProps &
  ServerFieldBase<NumberField, NumberFieldClientWithoutType>
export type NumberFieldLabelServerProps = FieldLabelServerProps<
  NumberField,
  NumberFieldClientWithoutType
>

export type NumberFieldLabelClientProps = FieldLabelClientProps<NumberFieldClientWithoutType>

export type NumberFieldDescriptionServerProps = FieldDescriptionServerProps<
  NumberField,
  NumberFieldClientWithoutType
>

export type NumberFieldDescriptionClientProps =
  FieldDescriptionClientProps<NumberFieldClientWithoutType>

export type NumberFieldErrorServerProps = FieldErrorServerProps<
  NumberField,
  NumberFieldClientWithoutType
>

export type NumberFieldErrorClientProps = FieldErrorClientProps<NumberFieldClientWithoutType>

export type NumberFieldDiffServerProps = FieldDiffServerProps<NumberField, NumberFieldClient>

export type NumberFieldDiffClientProps = FieldDiffClientProps<NumberFieldClient>
