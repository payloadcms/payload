import type { MarkOptional } from 'ts-essentials'

import type { CollapsibleField, CollapsibleFieldClient } from '../../fields/config/types.js'
import type { FieldErrorClientProps, FieldErrorServerProps } from '../forms/Error.js'
import type { ClientFieldBase, FieldPaths, ServerFieldBase } from '../forms/Field.js'
import type {
  FieldDescriptionClientProps,
  FieldDescriptionServerProps,
  FieldDiffClientProps,
  FieldDiffServerProps,
  FieldLabelClientProps,
  FieldLabelServerProps,
} from '../types.js'

type CollapsibleFieldBaseClientProps = FieldPaths

type CollapsibleFieldClientWithoutType = MarkOptional<CollapsibleFieldClient, 'type'>

export type CollapsibleFieldClientProps = ClientFieldBase<CollapsibleFieldClientWithoutType> &
  CollapsibleFieldBaseClientProps

export type CollapsibleFieldServerProps = ServerFieldBase<
  CollapsibleField,
  CollapsibleFieldClientWithoutType
>
export type CollapsibleFieldLabelServerProps = FieldLabelServerProps<
  CollapsibleField,
  CollapsibleFieldClientWithoutType
>

export type CollapsibleFieldLabelClientProps =
  FieldLabelClientProps<CollapsibleFieldClientWithoutType>

export type CollapsibleFieldDescriptionServerProps = FieldDescriptionServerProps<
  CollapsibleField,
  CollapsibleFieldClientWithoutType
>

export type CollapsibleFieldDescriptionClientProps =
  FieldDescriptionClientProps<CollapsibleFieldClientWithoutType>

export type CollapsibleFieldErrorServerProps = FieldErrorServerProps<
  CollapsibleField,
  CollapsibleFieldClientWithoutType
>

export type CollapsibleFieldErrorClientProps =
  FieldErrorClientProps<CollapsibleFieldClientWithoutType>

export type CollapsibleFieldDiffServerProps = FieldDiffServerProps<
  CollapsibleField,
  CollapsibleFieldClient
>

export type CollapsibleFieldDiffClientProps = FieldDiffClientProps<CollapsibleFieldClient>
