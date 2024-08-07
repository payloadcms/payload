import type { StaticLabel } from '../../config/types.js'
import type { ClientFieldConfig } from '../../fields/config/client.js'
import type { ArrayFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type {
  DescriptionComponent,
  FormFieldBase,
  LabelComponent,
  MappedComponent,
} from '../types.js'

export type ArrayClientField = {
  readonly fields: ClientFieldConfig[]
  readonly label: StaticLabel
} & Extract<ClientFieldConfig, { type: 'array' }>

export type ArrayFieldProps = {
  readonly CustomRowLabel?: MappedComponent
  readonly field: ArrayClientField
  readonly forceRender?: boolean
  readonly validate?: ArrayFieldValidation
} & Omit<FormFieldBase, 'validate'>


export type ArrayFieldLabelComponent = LabelComponent<'array'>

export type ArrayFieldDescriptionComponent = DescriptionComponent<'array'>

export type ArrayFieldErrorComponent = ErrorComponent<'array'>
