import type { MarkOptional } from 'ts-essentials'

import type { SelectField, SelectFieldClient } from '../../fields/config/types.js'
import type { SelectFieldValidation } from '../../fields/validations.js'
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

type SelectFieldClientWithoutType = MarkOptional<SelectFieldClient, 'type'>

type SelectFieldBaseClientProps = {
  readonly onChange?: (e: string | string[]) => void
  readonly path: string
  readonly validate?: SelectFieldValidation
  readonly value?: string
}

type SelectFieldBaseServerProps = Pick<FieldPaths, 'path'>

export type SelectFieldClientProps = ClientFieldBase<SelectFieldClientWithoutType> &
  SelectFieldBaseClientProps

export type SelectFieldServerProps = SelectFieldBaseServerProps &
  ServerFieldBase<SelectField, SelectFieldClientWithoutType>

export type SelectFieldServerComponent = FieldServerComponent<
  SelectField,
  SelectFieldClientWithoutType,
  SelectFieldBaseServerProps
>

export type SelectFieldClientComponent = FieldClientComponent<
  SelectFieldClientWithoutType,
  SelectFieldBaseClientProps
>

export type SelectFieldLabelServerComponent = FieldLabelServerComponent<
  SelectField,
  SelectFieldClientWithoutType
>

export type SelectFieldLabelClientComponent =
  FieldLabelClientComponent<SelectFieldClientWithoutType>

export type SelectFieldDescriptionServerComponent = FieldDescriptionServerComponent<
  SelectField,
  SelectFieldClientWithoutType
>

export type SelectFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<SelectFieldClientWithoutType>

export type SelectFieldErrorServerComponent = FieldErrorServerComponent<
  SelectField,
  SelectFieldClientWithoutType
>

export type SelectFieldErrorClientComponent =
  FieldErrorClientComponent<SelectFieldClientWithoutType>

export type SelectFieldDiffServerComponent = FieldDiffServerComponent<
  SelectField,
  SelectFieldClient
>

export type SelectFieldDiffClientComponent = FieldDiffClientComponent<SelectFieldClient>
