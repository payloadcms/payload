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

export type TabsFieldProps = {
  readonly field: MarkOptional<TabsFieldClient, 'type'>
} & FormFieldBase

export type TabsFieldLabelComponent = LabelComponent<'tabs'>

export type TabsFieldDescriptionComponent = DescriptionComponent<'tabs'>

export type TabsFieldErrorComponent = ErrorComponent<'tabs'>
