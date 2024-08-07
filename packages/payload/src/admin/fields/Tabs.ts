import type { StaticLabel } from '../../config/types.js'
import type { ClientFieldConfig } from '../../fields/config/client.js'
import type { NamedTab, UnnamedTab } from '../../fields/config/types.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type ClientTab =
  | ({ fields: ClientFieldConfig[] } & Omit<NamedTab, 'fields'>)
  | ({ fields: ClientFieldConfig[] } & Omit<UnnamedTab, 'fields'>)

export type TabsFieldClient = {
  readonly label: StaticLabel
  tabs: ClientTab[]
} & Omit<Extract<ClientFieldConfig, { type: 'tabs' }>, 'tabs'>

export type TabsFieldProps = {
  readonly field: TabsFieldClient
  readonly forceRender?: boolean
} & FormFieldBase

export type TabsFieldLabelComponent = LabelComponent<'tabs'>

export type TabsFieldDescriptionComponent = DescriptionComponent<'tabs'>

export type TabsFieldErrorComponent = ErrorComponent<'tabs'>
