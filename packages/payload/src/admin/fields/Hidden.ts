import type { ClientField } from '../../fields/config/types.js'
import type { ClientFieldBase } from '../types.js'

type HiddenFieldBaseClientProps = {
  readonly disableModifyingForm?: false
  readonly field?: {
    readonly name?: string
  } & ClientField
  readonly value?: unknown
}

export type HiddenFieldProps = ClientFieldBase & HiddenFieldBaseClientProps
