import type { MarkOptional } from 'ts-essentials'

import type {
  ClientField,
  NamedTab,
  TabsField,
  TabsFieldClient,
  UnnamedTab,
} from '../../fields/config/types.js'
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

export type ClientTab =
  | ({ fields: ClientField[]; passesCondition?: boolean; readonly path?: string } & Omit<
      NamedTab,
      'fields'
    >)
  | ({ fields: ClientField[]; passesCondition?: boolean } & Omit<UnnamedTab, 'fields'>)

type TabsFieldBaseClientProps = FieldPaths

type TabsFieldClientWithoutType = MarkOptional<TabsFieldClient, 'type'>

export type TabsFieldClientProps = ClientFieldBase<TabsFieldClientWithoutType> &
  TabsFieldBaseClientProps

export type TabsFieldServerProps = ServerFieldBase<TabsField, TabsFieldClientWithoutType>
export type TabsFieldLabelServerProps = FieldLabelServerProps<TabsField, TabsFieldClientWithoutType>

export type TabsFieldLabelClientProps = FieldLabelClientProps<TabsFieldClientWithoutType>

export type TabsFieldDescriptionServerProps = FieldDescriptionServerProps<
  TabsField,
  TabsFieldClientWithoutType
>

export type TabsFieldDescriptionClientProps =
  FieldDescriptionClientProps<TabsFieldClientWithoutType>

export type TabsFieldErrorServerProps = FieldErrorServerProps<TabsField, TabsFieldClientWithoutType>

export type TabsFieldErrorClientProps = FieldErrorClientProps<TabsFieldClientWithoutType>

export type TabsFieldDiffServerProps = FieldDiffServerProps<TabsField, TabsFieldClient>

export type TabsFieldDiffClientProps = FieldDiffClientProps<TabsFieldClient>
