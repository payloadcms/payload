import type { MarkOptional } from 'ts-essentials'

import type { CollapsibleField, CollapsibleFieldClient } from '../../fields/config/types.js'
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

type CollapsibleFieldClientWithoutType = MarkOptional<CollapsibleFieldClient, 'type'>

export type CollapsibleFieldClientProps = ClientFieldBase<CollapsibleFieldClientWithoutType>

export type CollapsibleFieldServerProps = ServerFieldBase<
  CollapsibleField,
  CollapsibleFieldClientWithoutType
>

export type CollapsibleFieldServerComponent = FieldServerComponent<
  CollapsibleField,
  CollapsibleFieldClientWithoutType
>

export type CollapsibleFieldClientComponent =
  FieldClientComponent<CollapsibleFieldClientWithoutType>

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
