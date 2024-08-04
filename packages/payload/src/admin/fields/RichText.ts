import type { GenericClientFieldConfig } from '../../fields/config/client.js'
import type { ErrorComponent } from '../forms/Error.js'
import type {
  DescriptionComponent,
  FormFieldBase,
  LabelComponent,
  MappedComponent,
} from '../types.js'

export type RichTextComponentProps = {
  readonly clientFieldConfig: GenericClientFieldConfig<'richText'>
  readonly name: string
  readonly richTextComponentMap?: Map<string, MappedComponent | unknown>
  readonly width?: string
} & FormFieldBase

export type RichTextFieldLabelComponent = LabelComponent<'richText'>

export type RichTextFieldDescriptionComponent = DescriptionComponent<'richText'>

export type RichTextFieldErrorComponent = ErrorComponent<'richText'>
