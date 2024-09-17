import type { MarkOptional } from 'ts-essentials'

import type { CheckboxField, CheckboxFieldClient } from '../../fields/config/types.js'
import type { CheckboxFieldValidation } from '../../fields/validations.js'
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

type CheckboxFieldClientWithoutType = MarkOptional<CheckboxFieldClient, 'type'>

type CheckboxFieldBaseClientProps = {
  readonly checked?: boolean
  readonly disableFormData?: boolean
  readonly id?: string
  readonly onChange?: (value: boolean) => void
  readonly partialChecked?: boolean
  readonly validate?: CheckboxFieldValidation
}

export type CheckboxFieldClientProps = CheckboxFieldBaseClientProps &
  ClientFieldBase<CheckboxFieldClientWithoutType>

export type CheckboxFieldServerProps = ServerFieldBase<
  CheckboxField,
  CheckboxFieldClientWithoutType
>

export type CheckboxFieldServerComponent = FieldServerComponent<
  CheckboxField,
  CheckboxFieldClientWithoutType
>

export type CheckboxFieldClientComponent = FieldClientComponent<
  CheckboxFieldClientWithoutType,
  CheckboxFieldBaseClientProps
>

export type CheckboxFieldLabelServerComponent = FieldLabelServerComponent<
  CheckboxField,
  CheckboxFieldClientWithoutType
>

export type CheckboxFieldLabelClientComponent =
  FieldLabelClientComponent<CheckboxFieldClientWithoutType>

export type CheckboxFieldDescriptionServerComponent = FieldDescriptionServerComponent<
  CheckboxField,
  CheckboxFieldClientWithoutType
>

export type CheckboxFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<CheckboxFieldClientWithoutType>

export type CheckboxFieldErrorServerComponent = FieldErrorServerComponent<
  CheckboxField,
  CheckboxFieldClientWithoutType
>

export type CheckboxFieldErrorClientComponent =
  FieldErrorClientComponent<CheckboxFieldClientWithoutType>
