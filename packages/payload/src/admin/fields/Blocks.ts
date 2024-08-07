import type { StaticLabel } from '../../config/types.js'
import type { ClientFieldConfig } from '../../fields/config/client.js'
import type { BlockField } from '../../fields/config/types.js'
import type { BlockFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type {
  DescriptionComponent,
  FormFieldBase,
  LabelComponent,
  MappedComponent,
} from '../types.js'

export type BlocksFieldClient = {
  blocks: ClientBlock[]
  label: StaticLabel
} & Omit<Extract<ClientFieldConfig, { type: 'blocks' }>, 'blocks'>

export type BlocksFieldProps = {
  readonly field: BlocksFieldClient
  readonly forceRender?: boolean
  readonly slug?: string
  readonly validate?: BlockFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type ClientBlock = {
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
