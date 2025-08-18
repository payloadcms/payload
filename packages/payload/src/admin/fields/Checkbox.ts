import type { MarkOptional } from 'ts-essentials'

import type { CheckboxField, CheckboxFieldClient } from '../../fields/config/types.js'
import type { CheckboxFieldValidation } from '../../fields/validations.js'
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

export type CheckboxFieldServerComponent = FieldServerComponent<
  CheckboxField,
  CheckboxFieldClientWithoutType,
  CheckboxFieldBaseServerProps
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

export type CheckboxFieldDiffServerComponent = FieldDiffServerComponent<
  CheckboxField,
  CheckboxFieldClient
>

export type CheckboxFieldDiffClientComponent = FieldDiffClientComponent<CheckboxFieldClient>
