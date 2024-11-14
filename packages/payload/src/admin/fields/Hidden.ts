import type { ClientField } from '../../fields/config/types.js'
import type { ClientFieldBase, FieldPaths } from '../types.js'

type HiddenFieldBaseClientProps = {
  readonly disableModifyingForm?: false
  readonly field?: {
    readonly name?: string
  } & ClientField
  readonly path: string
  readonly value?: unknown
} & Omit<FieldPaths, 'indexPath'>

export type HiddenFieldProps = ClientFieldBase & HiddenFieldBaseClientProps
