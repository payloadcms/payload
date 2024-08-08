import type { MarkOptional } from 'ts-essentials'

import type { BlockFieldClient, ClientField, LabelsClient } from '../../fields/config/types.js'
import type { BlockFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type {
  DescriptionComponent,
  FormFieldBase,
  LabelComponent,
  MappedComponent,
} from '../types.js'

export type BlockFieldProps = {
  readonly field: MarkOptional<BlockFieldClient, 'type'>
  readonly forceRender?: boolean
  readonly slug?: string
  readonly validate?: BlockFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type ClientBlock = {
  LabelComponent: MappedComponent
  custom?: Record<any, string>
  fields: ClientField[]
  imageAltText?: string
  imageURL?: string
  labels?: LabelsClient
  slug: string
}

export type BlockFieldLabelComponent = LabelComponent<'blocks'>

export type BlockFieldDescriptionComponent = DescriptionComponent<'blocks'>

export type BlockFieldErrorComponent = ErrorComponent<'blocks'>
