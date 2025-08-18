import type { MarkOptional } from 'ts-essentials'

import type { JSONField, JSONFieldClient } from '../../fields/config/types.js'
import type { JSONFieldValidation } from '../../fields/validations.js'
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

export type JSONFieldServerComponent = FieldServerComponent<
  JSONField,
  JSONFieldClientWithoutType,
  JSONFieldBaseServerProps
>

export type JSONFieldClientComponent = FieldClientComponent<
  JSONFieldClientWithoutType,
  JSONFieldBaseClientProps
>

export type JSONFieldLabelServerComponent = FieldLabelServerComponent<
  JSONField,
  JSONFieldClientWithoutType
>

export type JSONFieldLabelClientComponent = FieldLabelClientComponent<JSONFieldClientWithoutType>

export type JSONFieldDescriptionServerComponent = FieldDescriptionServerComponent<
  JSONField,
  JSONFieldClientWithoutType
>

export type JSONFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<JSONFieldClientWithoutType>

export type JSONFieldErrorServerComponent = FieldErrorServerComponent<
  JSONField,
  JSONFieldClientWithoutType
>

export type JSONFieldErrorClientComponent = FieldErrorClientComponent<JSONFieldClientWithoutType>

export type JSONFieldDiffServerComponent = FieldDiffServerComponent<JSONField, JSONFieldClient>

export type JSONFieldDiffClientComponent = FieldDiffClientComponent<JSONFieldClient>
