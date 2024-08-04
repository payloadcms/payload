import type { GenericClientFieldConfig } from '../../fields/config/client.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type SelectFieldProps = {
  readonly clientFieldConfig: GenericClientFieldConfig<'select'>
  readonly onChange?: (e: string | string[]) => void
  readonly value?: string
} & FormFieldBase

export type SelectFieldLabelComponent = LabelComponent<'select'>

export type SelectFieldDescriptionComponent = DescriptionComponent<'select'>

export type SelectFieldErrorComponent = ErrorComponent<'select'>
