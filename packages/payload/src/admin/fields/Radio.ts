import type { MarkOptional } from 'ts-essentials'

import type { RadioField, RadioFieldClient } from '../../fields/config/types.js'
import type { RadioFieldValidation } from '../../fields/validations.js'
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

export type RadioFieldServerComponent = FieldServerComponent<
  RadioField,
  RadioFieldClientWithoutType,
  RadioFieldBaseServerProps
>

export type RadioFieldClientComponent = FieldClientComponent<
  RadioFieldClientWithoutType,
  RadioFieldBaseClientProps
>

type OnChange<T = string> = (value: T) => void

export type RadioFieldLabelServerComponent = FieldLabelServerComponent<
  RadioField,
  RadioFieldClientWithoutType
>

export type RadioFieldLabelClientComponent = FieldLabelClientComponent<RadioFieldClientWithoutType>

export type RadioFieldDescriptionServerComponent = FieldDescriptionServerComponent<
  RadioField,
  RadioFieldClientWithoutType
>

export type RadioFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<RadioFieldClientWithoutType>

export type RadioFieldErrorServerComponent = FieldErrorServerComponent<
  RadioField,
  RadioFieldClientWithoutType
>

export type RadioFieldErrorClientComponent = FieldErrorClientComponent<RadioFieldClientWithoutType>

export type RadioFieldDiffServerComponent = FieldDiffServerComponent<RadioField, RadioFieldClient>

export type RadioFieldDiffClientComponent = FieldDiffClientComponent<RadioFieldClient>
