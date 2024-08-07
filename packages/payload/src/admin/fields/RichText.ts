import type { StaticLabel } from '../../config/types.js'
import type { ClientFieldConfig } from '../../fields/config/client.js'
import type { RichTextFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type RichTextFieldClient = {
  label: StaticLabel
  richTextComponentMap?: Map<string, unknown>
} & Extract<ClientFieldConfig, { type: 'richText' }>

export type RichTextFieldProps = {
  readonly field: RichTextFieldClient
  readonly name: string
  readonly validate?: RichTextFieldValidation
  readonly width?: string
} & Omit<FormFieldBase, 'validate'>

export type RichTextFieldLabelComponent = LabelComponent<'richText'>

export type RichTextFieldDescriptionComponent = DescriptionComponent<'richText'>

export type RichTextFieldErrorComponent = ErrorComponent<'richText'>
