import type { ClientField } from '../../fields/config/client.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type HiddenFieldProps = {
  readonly disableModifyingForm?: false
  readonly field?: {
    readonly name?: string
  } & Pick<ClientField, '_path'>
  readonly forceUsePathFromProps?: boolean
  readonly value?: unknown
} & FormFieldBase

export type HiddenFieldLabelComponent = LabelComponent<'hidden'>

export type HiddenFieldDescriptionComponent = DescriptionComponent<'hidden'>

export type HiddenFieldErrorComponent = ErrorComponent<'hidden'>
