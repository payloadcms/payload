import type { MarkOptional } from 'ts-essentials'

import type { NumberField, NumberFieldClient } from '../../fields/config/types.js'
import type { NumberFieldValidation } from '../../fields/validations.js'
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

export type NumberFieldServerComponent = FieldServerComponent<
  NumberField,
  NumberFieldClientWithoutType,
  NumberFieldBaseServerProps
>

export type NumberFieldClientComponent = FieldClientComponent<
  NumberFieldClientWithoutType,
  NumberFieldBaseClientProps
>

export type NumberFieldLabelServerComponent = FieldLabelServerComponent<
  NumberField,
  NumberFieldClientWithoutType
>

export type NumberFieldLabelClientComponent =
  FieldLabelClientComponent<NumberFieldClientWithoutType>

export type NumberFieldDescriptionServerComponent = FieldDescriptionServerComponent<
  NumberField,
  NumberFieldClientWithoutType
>

export type NumberFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<NumberFieldClientWithoutType>

export type NumberFieldErrorServerComponent = FieldErrorServerComponent<
  NumberField,
  NumberFieldClientWithoutType
>

export type NumberFieldErrorClientComponent =
  FieldErrorClientComponent<NumberFieldClientWithoutType>

export type NumberFieldDiffServerComponent = FieldDiffServerComponent<
  NumberField,
  NumberFieldClient
>

export type NumberFieldDiffClientComponent = FieldDiffClientComponent<NumberFieldClient>
