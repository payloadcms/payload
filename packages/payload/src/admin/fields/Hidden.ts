import type { ClientField } from '../../fields/config/client.js'
import type { FormFieldBase } from '../types.js'

export type HiddenFieldProps = {
  readonly disableModifyingForm?: false
  readonly field?: {
    readonly name?: string
  } & ClientField
  readonly forceUsePathFromProps?: boolean
  readonly value?: unknown
} & FormFieldBase
