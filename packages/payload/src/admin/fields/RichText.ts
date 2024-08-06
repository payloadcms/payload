import type { StaticLabel } from '../../config/types.js'
import type { ClientFieldConfig } from '../../fields/config/client.js'
import type { RichTextFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type {
  DescriptionComponent,
  FormFieldBase,
  LabelComponent,
  MappedComponent,
} from '../types.js'

export type RichTextFieldClient = {
  readonly label: StaticLabel
} & Extract<ClientFieldConfig, { type: 'richText' }>

export type RichTextComponentProps = {
  readonly field: RichTextFieldClient
  readonly name: string
  readonly richTextComponentMap?: Map<string, MappedComponent | unknown>
  readonly validate?: RichTextFieldValidation
  readonly width?: string
} & FormFieldBase

export type RichTextFieldLabelComponent = LabelComponent<'richText'>

export type RichTextFieldDescriptionComponent = DescriptionComponent<'richText'>

export type RichTextFieldErrorComponent = ErrorComponent<'richText'>
