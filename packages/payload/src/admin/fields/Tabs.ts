import type { StaticLabel } from '../../config/types.js'
import type { ClientFieldConfig } from '../../fields/config/client.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type TabsFieldClient = {
  readonly label: StaticLabel
} & Extract<ClientFieldConfig, { type: 'tabs' }>

export type TabsFieldProps = {
  readonly field: TabsFieldClient
  readonly forceRender?: boolean
} & FormFieldBase

export type TabsFieldLabelComponent = LabelComponent<'tabs'>

export type TabsFieldDescriptionComponent = DescriptionComponent<'tabs'>

export type TabsFieldErrorComponent = ErrorComponent<'tabs'>
