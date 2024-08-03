import type { ClientFieldConfig } from '../../fields/config/client.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type TabsFieldProps = {
  readonly forceRender?: boolean
  readonly name?: string
  readonly path?: string
  readonly tabs?: ClientFieldConfig[]
  readonly width?: string
} & FormFieldBase

export type TabsFieldLabelComponent = LabelComponent<'tabs'>

export type TabsFieldDescriptionComponent = DescriptionComponent<'tabs'>

export type TabsFieldErrorComponent = ErrorComponent<'tabs'>
