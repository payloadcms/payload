import type { GenericClientFieldConfig } from '../../fields/config/client.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type CodeFieldProps = {
  readonly autoComplete?: string
  readonly clientFieldConfig: GenericClientFieldConfig<'email'>
} & FormFieldBase

export type CodeFieldLabelComponent = LabelComponent<'code'>

export type CodeFieldDescriptionComponent = DescriptionComponent<'code'>

export type CodeFieldErrorComponent = ErrorComponent<'code'>
