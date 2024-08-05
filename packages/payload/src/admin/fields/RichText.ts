import type { RichTextFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type {
  DescriptionComponent,
  FormFieldBase,
  LabelComponent,
  MappedComponent,
} from '../types.js'

export type RichTextComponentProps = {
  name: string
  richTextComponentMap?: Map<string, MappedComponent[] | React.ReactNode>
  validate?: RichTextFieldValidation
  width?: string
} & FormFieldBase

export type RichTextFieldLabelComponent = LabelComponent<'richText'>

export type RichTextFieldDescriptionComponent = DescriptionComponent<'richText'>

export type RichTextFieldErrorComponent = ErrorComponent<'richText'>
