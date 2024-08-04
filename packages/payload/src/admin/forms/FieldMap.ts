import type { ClientFieldConfig } from '../../fields/config/client.js'
import type { BlockField, TabsField } from '../../fields/config/types.js'
import type { MappedComponent } from '../types.js'

export type MappedTab = {
  fields?: ClientFieldConfig[]
  label: TabsField['tabs'][0]['label']
  name?: string
}

export type ReducedBlock = {
  LabelComponent: MappedComponent
  custom?: Record<any, string>
  fields: ClientFieldConfig[]
  imageAltText?: string
  imageURL?: string
  labels: BlockField['labels']
  slug: string
}
