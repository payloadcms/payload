import type { MarkOptional } from 'ts-essentials'

import type { DateField, DateFieldClient } from '../../fields/config/types.js'
import type { DateFieldValidation } from '../../fields/validations.js'
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

type DateFieldClientWithoutType = MarkOptional<DateFieldClient, 'type'>

type DateFieldBaseClientProps = {
  readonly path: string
  readonly validate?: DateFieldValidation
}

type DateFieldBaseServerProps = Pick<FieldPaths, 'path'>

export type DateFieldClientProps = ClientFieldBase<DateFieldClientWithoutType> &
  DateFieldBaseClientProps

export type DateFieldServerProps = DateFieldBaseServerProps &
  ServerFieldBase<DateField, DateFieldClientWithoutType>

export type DateFieldServerComponent = FieldServerComponent<
  DateField,
  DateFieldClientWithoutType,
  DateFieldBaseServerProps
>

export type DateFieldClientComponent = FieldClientComponent<
  DateFieldClientWithoutType,
  DateFieldBaseClientProps
>

export type DateFieldLabelServerComponent = FieldLabelServerComponent<
  DateField,
  DateFieldClientWithoutType
>

export type DateFieldLabelClientComponent = FieldLabelClientComponent<DateFieldClientWithoutType>

export type DateFieldDescriptionServerComponent = FieldDescriptionServerComponent<
  DateField,
  DateFieldClientWithoutType
>

export type DateFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<DateFieldClientWithoutType>

export type DateFieldErrorServerComponent = FieldErrorServerComponent<
  DateField,
  DateFieldClientWithoutType
>

export type DateFieldErrorClientComponent = FieldErrorClientComponent<DateFieldClientWithoutType>

export type DateFieldDiffServerComponent = FieldDiffServerComponent<DateField, DateFieldClient>

export type DateFieldDiffClientComponent = FieldDiffClientComponent<DateFieldClient>
