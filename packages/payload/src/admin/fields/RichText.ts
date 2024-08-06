import type { RichTextFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { MappedField } from '../forms/FieldMap.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type RichTextComponentProps = {
  name: string
  richTextComponentMap?: Map<string, MappedField[] | React.ReactNode>
  validate?: RichTextFieldValidation
  width?: string
} & Omit<FormFieldBase, 'validate'>

export type RichTextFieldLabelComponent = LabelComponent<'richText'>

export type RichTextFieldDescriptionComponent = DescriptionComponent<'richText'>

export type RichTextFieldErrorComponent = ErrorComponent<'richText'>
