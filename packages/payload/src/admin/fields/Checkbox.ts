import type { MarkOptional } from 'ts-essentials'

import type { CheckboxField, CheckboxFieldClient } from '../../fields/config/types.js'
import type { CheckboxFieldValidation } from '../../fields/validations.js'
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

type CheckboxFieldClientWithoutType = MarkOptional<CheckboxFieldClient, 'type'>

type CheckboxFieldBaseClientProps = {
  readonly checked?: boolean
  readonly disableFormData?: boolean
  readonly id?: string
  readonly onChange?: (value: boolean) => void
  readonly partialChecked?: boolean
  readonly path: string
  readonly validate?: CheckboxFieldValidation
}

type CheckboxFieldBaseServerProps = Pick<FieldPaths, 'path'>

export type CheckboxFieldClientProps = CheckboxFieldBaseClientProps &
  ClientFieldBase<CheckboxFieldClientWithoutType>

export type CheckboxFieldServerProps = CheckboxFieldBaseServerProps &
  ServerFieldBase<CheckboxField, CheckboxFieldClientWithoutType>
export type CheckboxFieldLabelServerProps = FieldLabelServerProps<
  CheckboxField,
  CheckboxFieldClientWithoutType
>

export type CheckboxFieldLabelClientProps = FieldLabelClientProps<CheckboxFieldClientWithoutType>

export type CheckboxFieldDescriptionServerProps = FieldDescriptionServerProps<
  CheckboxField,
  CheckboxFieldClientWithoutType
>

export type CheckboxFieldDescriptionClientProps =
  FieldDescriptionClientProps<CheckboxFieldClientWithoutType>

export type CheckboxFieldErrorServerProps = FieldErrorServerProps<
  CheckboxField,
  CheckboxFieldClientWithoutType
>

export type CheckboxFieldErrorClientProps = FieldErrorClientProps<CheckboxFieldClientWithoutType>

export type CheckboxFieldDiffServerProps = FieldDiffServerProps<CheckboxField, CheckboxFieldClient>

export type CheckboxFieldDiffClientProps = FieldDiffClientProps<CheckboxFieldClient>
