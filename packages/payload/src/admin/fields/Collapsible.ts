import type { MarkOptional } from 'ts-essentials'

import type { CollapsibleField, CollapsibleFieldClient } from '../../fields/config/types.js'
import type { FieldErrorClientComponent, FieldErrorServerComponent } from '../forms/Error.js'
import type {
  FieldDescriptionClientComponent,
  FieldDescriptionServerComponent,
  FieldLabelClientComponent,
  FieldLabelServerComponent,
  FormFieldBase,
} from '../types.js'

type CollapsibleFieldClientWithoutType = MarkOptional<CollapsibleFieldClient, 'type'>

export type CollapsibleFieldProps = FormFieldBase<CollapsibleFieldClientWithoutType>

export type CollapsibleFieldLabelServerComponent = FieldLabelServerComponent<CollapsibleField>

export type CollapsibleFieldLabelClientComponent =
  FieldLabelClientComponent<CollapsibleFieldClientWithoutType>

export type CollapsibleFieldDescriptionServerComponent =
  FieldDescriptionServerComponent<CollapsibleField>

export type CollapsibleFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<CollapsibleFieldClientWithoutType>

export type CollapsibleFieldErrorServerComponent = FieldErrorServerComponent<CollapsibleField>

export type CollapsibleFieldErrorClientComponent =
  FieldErrorClientComponent<CollapsibleFieldClientWithoutType>
