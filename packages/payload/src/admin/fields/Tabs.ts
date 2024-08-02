import type { ClientFieldConfig } from '../../fields/config/client.js'
import type { TabsField } from '../../fields/config/types.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type TabsFieldProps = {
  forceRender?: boolean
  name?: string
  path?: string
  tabs?: MappedTab[]
  width?: string
} & FormFieldBase

export type MappedTab = {
  fields?: ClientFieldConfig[]
  label: TabsField['tabs'][0]['label']
  name?: string
}

export type TabsFieldLabelComponent = LabelComponent<'tabs'>

export type TabsFieldDescriptionComponent = DescriptionComponent<'tabs'>

export type TabsFieldErrorComponent = ErrorComponent<'tabs'>
