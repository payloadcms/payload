import type { MarkOptional } from 'ts-essentials'

import type { JSONField, JSONFieldClient } from '../../fields/config/types.js'
import type { JSONFieldValidation } from '../../fields/validations.js'
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

type JSONFieldClientWithoutType = MarkOptional<JSONFieldClient, 'type'>

type JSONFieldBaseClientProps = {
  readonly path: string
  readonly validate?: JSONFieldValidation
}

type JSONFieldBaseServerProps = Pick<FieldPaths, 'path'>

export type JSONFieldClientProps = ClientFieldBase<JSONFieldClientWithoutType> &
  JSONFieldBaseClientProps

export type JSONFieldServerProps = JSONFieldBaseServerProps &
  ServerFieldBase<JSONField, JSONFieldClientWithoutType>
export type JSONFieldLabelServerProps = FieldLabelServerProps<JSONField, JSONFieldClientWithoutType>

export type JSONFieldLabelClientProps = FieldLabelClientProps<JSONFieldClientWithoutType>

export type JSONFieldDescriptionServerProps = FieldDescriptionServerProps<
  JSONField,
  JSONFieldClientWithoutType
>

export type JSONFieldDescriptionClientProps =
  FieldDescriptionClientProps<JSONFieldClientWithoutType>

export type JSONFieldErrorServerProps = FieldErrorServerProps<JSONField, JSONFieldClientWithoutType>

export type JSONFieldErrorClientProps = FieldErrorClientProps<JSONFieldClientWithoutType>

export type JSONFieldDiffServerProps = FieldDiffServerProps<JSONField, JSONFieldClient>

export type JSONFieldDiffClientProps = FieldDiffClientProps<JSONFieldClient>
