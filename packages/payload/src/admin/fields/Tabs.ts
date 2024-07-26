import type { TabsField } from '../../fields/config/types.js'
import type { FieldMap } from '../forms/FieldMap.js'
import type { FormFieldBase } from '../types.js'

export type TabsFieldProps = {
  forceRender?: boolean
  name?: string
  path?: string
  tabs?: MappedTab[]
  type?: 'tabs'
  width?: string
} & FormFieldBase

export type MappedTab = {
  fieldMap?: FieldMap
  label: TabsField['tabs'][0]['label']
  name?: string
}
