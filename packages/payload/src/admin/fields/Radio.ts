import type { MarkOptional } from 'ts-essentials'

import type { RadioField, RadioFieldClient } from '../../fields/config/types.js'
import type { RadioFieldValidation } from '../../fields/validations.js'
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

type RadioFieldClientWithoutType = MarkOptional<RadioFieldClient, 'type'>

type RadioFieldBaseClientProps = {
  /**
   * Threaded through to the setValue function from the form context when the value changes
   */
  readonly disableModifyingForm?: boolean
  readonly onChange?: OnChange
  readonly path: string
  readonly validate?: RadioFieldValidation
  readonly value?: string
}

type RadioFieldBaseServerProps = Pick<FieldPaths, 'path'>

export type RadioFieldClientProps = ClientFieldBase<RadioFieldClientWithoutType> &
  RadioFieldBaseClientProps

export type RadioFieldServerProps = RadioFieldBaseServerProps &
  ServerFieldBase<RadioField, RadioFieldClientWithoutType>
type OnChange<T = string> = (value: T) => void

export type RadioFieldLabelServerProps = FieldLabelServerProps<
  RadioField,
  RadioFieldClientWithoutType
>

export type RadioFieldLabelClientProps = FieldLabelClientProps<RadioFieldClientWithoutType>

export type RadioFieldDescriptionServerProps = FieldDescriptionServerProps<
  RadioField,
  RadioFieldClientWithoutType
>

export type RadioFieldDescriptionClientProps =
  FieldDescriptionClientProps<RadioFieldClientWithoutType>

export type RadioFieldErrorServerProps = FieldErrorServerProps<
  RadioField,
  RadioFieldClientWithoutType
>

export type RadioFieldErrorClientProps = FieldErrorClientProps<RadioFieldClientWithoutType>

export type RadioFieldDiffServerProps = FieldDiffServerProps<RadioField, RadioFieldClient>

export type RadioFieldDiffClientProps = FieldDiffClientProps<RadioFieldClient>
