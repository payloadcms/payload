import type { MarkOptional } from 'ts-essentials'

import type { JoinField, JoinFieldClient } from '../../fields/config/types.js'
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
  FieldLabelClientComponent,
  FieldLabelServerComponent,
} from '../types.js'

type JoinFieldClientWithoutType = MarkOptional<JoinFieldClient, 'type'>

type JoinFieldBaseClientProps = {
  readonly path: string
}

type JoinFieldBaseServerProps = Pick<FieldPaths, 'path'>

export type JoinFieldClientProps = ClientFieldBase<JoinFieldClientWithoutType> &
  JoinFieldBaseClientProps

export type JoinFieldServerProps = JoinFieldBaseServerProps & ServerFieldBase<JoinField>

export type JoinFieldServerComponent = FieldServerComponent<
  JoinField,
  JoinFieldClientWithoutType,
  JoinFieldBaseServerProps
>

export type JoinFieldClientComponent = FieldClientComponent<
  JoinFieldClientWithoutType,
  JoinFieldBaseClientProps
>

export type JoinFieldLabelServerComponent = FieldLabelServerComponent<JoinField>

export type JoinFieldLabelClientComponent = FieldLabelClientComponent<JoinFieldClientWithoutType>

export type JoinFieldDescriptionServerComponent = FieldDescriptionServerComponent<JoinField>

export type JoinFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<JoinFieldClientWithoutType>

export type JoinFieldErrorServerComponent = FieldErrorServerComponent<JoinField>

export type JoinFieldErrorClientComponent = FieldErrorClientComponent<JoinFieldClientWithoutType>
