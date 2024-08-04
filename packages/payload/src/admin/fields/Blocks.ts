import type { ClientFieldConfig, GenericClientFieldConfig } from '../../fields/config/client.js'
import type { BlockField } from '../../fields/config/types.js'
import type { ErrorComponent } from '../forms/Error.js'
import type {
  DescriptionComponent,
  FormFieldBase,
  LabelComponent,
  MappedComponent,
} from '../types.js'

export type BlocksFieldProps = {
  readonly clientFieldConfig: GenericClientFieldConfig<'blocks'>
  readonly forceRender?: boolean
  readonly slug?: string
} & FormFieldBase

export type ReducedBlock = {
  LabelComponent: MappedComponent
  custom?: Record<any, string>
  fields: ClientFieldConfig[]
  imageAltText?: string
  imageURL?: string
  labels: BlockField['labels']
  slug: string
}

export type BlocksFieldLabelComponent = LabelComponent<'blocks'>

export type BlocksFieldDescriptionComponent = DescriptionComponent<'blocks'>

export type BlocksFieldErrorComponent = ErrorComponent<'blocks'>
