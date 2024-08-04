import type { GenericClientFieldConfig } from '../../fields/config/client.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type CheckboxFieldProps = {
  readonly checked?: boolean
  readonly clientFieldConfig: GenericClientFieldConfig<'checkbox'>
  readonly disableFormData?: boolean
  readonly id?: string
  readonly onChange?: (value: boolean) => void
  readonly partialChecked?: boolean
} & FormFieldBase

export type CheckboxFieldLabelComponent = LabelComponent<'checkbox'>

export type CheckboxFieldDescriptionComponent = DescriptionComponent<'checkbox'>

export type CheckboxFieldErrorComponent = ErrorComponent<'checkbox'>
