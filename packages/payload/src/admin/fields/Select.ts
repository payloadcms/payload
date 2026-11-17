import type { MarkOptional } from 'ts-essentials'

import type { SelectField, SelectFieldClient } from '../../fields/config/types.js'
import type { SelectFieldValidation } from '../../fields/validations.js'
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

type SelectFieldClientWithoutType = MarkOptional<SelectFieldClient, 'type'>

type SelectFieldBaseClientProps = {
  readonly onChange?: (e: string | string[]) => void
  readonly path: string
  readonly validate?: SelectFieldValidation
  readonly value?: string | string[]
}

type SelectFieldBaseServerProps = Pick<FieldPaths, 'path'>

export type SelectFieldClientProps = ClientFieldBase<SelectFieldClientWithoutType> &
  SelectFieldBaseClientProps

export type SelectFieldServerProps = SelectFieldBaseServerProps &
  ServerFieldBase<SelectField, SelectFieldClientWithoutType>
export type SelectFieldLabelServerProps = FieldLabelServerProps<
  SelectField,
  SelectFieldClientWithoutType
>

export type SelectFieldLabelClientProps = FieldLabelClientProps<SelectFieldClientWithoutType>

export type SelectFieldDescriptionServerProps = FieldDescriptionServerProps<
  SelectField,
  SelectFieldClientWithoutType
>

export type SelectFieldDescriptionClientProps =
  FieldDescriptionClientProps<SelectFieldClientWithoutType>

export type SelectFieldErrorServerProps = FieldErrorServerProps<
  SelectField,
  SelectFieldClientWithoutType
>

export type SelectFieldErrorClientProps = FieldErrorClientProps<SelectFieldClientWithoutType>

export type SelectFieldDiffServerProps = FieldDiffServerProps<SelectField, SelectFieldClient>

export type SelectFieldDiffClientProps = FieldDiffClientProps<SelectFieldClient>
