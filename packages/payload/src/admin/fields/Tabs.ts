import type { MarkOptional } from 'ts-essentials'

import type {
  ClientField,
  NamedTab,
  TabsFieldClient,
  UnnamedTab,
} from '../../fields/config/types.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type ClientTab =
  | ({ fields: ClientField[] } & Omit<NamedTab, 'fields'>)
  | ({ fields: ClientField[] } & Omit<UnnamedTab, 'fields'>)

export type TabsFieldClientWithoutType = MarkOptional<TabsFieldClient, 'type'>

export type TabsFieldProps = {
  readonly field: TabsFieldClientWithoutType
} & FormFieldBase

export type TabsFieldLabelComponent = LabelComponent<TabsFieldClientWithoutType>

export type TabsFieldDescriptionComponent = DescriptionComponent<TabsFieldClientWithoutType>

export type TabsFieldErrorComponent = ErrorComponent<TabsFieldClientWithoutType>
