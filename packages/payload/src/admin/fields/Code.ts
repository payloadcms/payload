import type { StaticLabel } from '../../config/types.js'
import type { ClientFieldConfig } from '../../fields/config/client.js'
import type { CodeFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type CodeFieldClient = {
  readonly label: StaticLabel
} & Extract<ClientFieldConfig, { type: 'code' }>

export type CodeFieldProps = {
  readonly autoComplete?: string
  readonly field: CodeFieldClient
  readonly validate?: CodeFieldValidation
} & FormFieldBase

export type CodeFieldLabelComponent = LabelComponent<'code'>

export type CodeFieldDescriptionComponent = DescriptionComponent<'code'>

export type CodeFieldErrorComponent = ErrorComponent<'code'>
