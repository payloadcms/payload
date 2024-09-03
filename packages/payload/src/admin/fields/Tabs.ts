import type { MarkOptional } from 'ts-essentials'

import type {
  ClientField,
  NamedTab,
  TabsField,
  TabsFieldClient,
  UnnamedTab,
} from '../../fields/config/types.js'
import type { FieldErrorClientComponent, FieldErrorServerComponent } from '../forms/Error.js'
import type {
  FieldDescriptionClientComponent,
  FieldDescriptionServerComponent,
  FieldLabelClientComponent,
  FieldLabelServerComponent,
  FormFieldBase,
} from '../types.js'

export type ClientTab =
  | ({ fields: ClientField[] } & Omit<NamedTab, 'fields'>)
  | ({ fields: ClientField[] } & Omit<UnnamedTab, 'fields'>)

export type TabsFieldClientWithoutType = MarkOptional<TabsFieldClient, 'type'>

export type TabsFieldProps = FormFieldBase<TabsFieldClientWithoutType>

export type TabsFieldLabelServerComponent = FieldLabelServerComponent<TabsField>

export type TabsFieldLabelClientComponent = FieldLabelClientComponent<TabsFieldClientWithoutType>

export type TabsFieldDescriptionServerComponent = FieldDescriptionServerComponent<TabsField>

export type TabsFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<TabsFieldClientWithoutType>

export type TabsFieldErrorServerComponent = FieldErrorServerComponent<TabsField>

export type TabsFieldErrorClientComponent = FieldErrorClientComponent<TabsFieldClientWithoutType>
