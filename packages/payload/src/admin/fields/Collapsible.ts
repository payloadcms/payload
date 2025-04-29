import type { MarkOptional } from 'ts-essentials'

import type { CollapsibleField, CollapsibleFieldClient } from '../../fields/config/types.js'
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

type CollapsibleFieldBaseClientProps = FieldPaths

type CollapsibleFieldClientWithoutType = MarkOptional<CollapsibleFieldClient, 'type'>

export type CollapsibleFieldClientProps = ClientFieldBase<CollapsibleFieldClientWithoutType> &
  CollapsibleFieldBaseClientProps

export type CollapsibleFieldServerProps = ServerFieldBase<
  CollapsibleField,
  CollapsibleFieldClientWithoutType
>

export type CollapsibleFieldServerComponent<T extends Record<string, unknown> = {}> =
  FieldServerComponent<CollapsibleField, CollapsibleFieldClientWithoutType & T>

export type CollapsibleFieldClientComponent<T extends Record<string, unknown> = {}> =
  FieldClientComponent<CollapsibleFieldClientWithoutType, CollapsibleFieldBaseClientProps & T>

export type CollapsibleFieldLabelServerComponent = FieldLabelServerComponent<
  CollapsibleField,
  CollapsibleFieldClientWithoutType
>

export type CollapsibleFieldLabelClientComponent =
  FieldLabelClientComponent<CollapsibleFieldClientWithoutType>

export type CollapsibleFieldDescriptionServerComponent = FieldDescriptionServerComponent<
  CollapsibleField,
  CollapsibleFieldClientWithoutType
>

export type CollapsibleFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<CollapsibleFieldClientWithoutType>

export type CollapsibleFieldErrorServerComponent = FieldErrorServerComponent<
  CollapsibleField,
  CollapsibleFieldClientWithoutType
>

export type CollapsibleFieldErrorClientComponent =
  FieldErrorClientComponent<CollapsibleFieldClientWithoutType>

export type CollapsibleFieldDiffServerComponent = FieldDiffServerComponent<
  CollapsibleField,
  CollapsibleFieldClient
>

export type CollapsibleFieldDiffClientComponent = FieldDiffClientComponent<CollapsibleFieldClient>
