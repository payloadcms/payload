import type { ClientFieldBase, FieldPaths } from '../types.js'

type HiddenFieldBaseClientProps = {
  readonly disableModifyingForm?: false
  readonly field?: never
  readonly path: string
  readonly value?: unknown
} & Omit<FieldPaths, 'indexPath'>

export type HiddenFieldProps = HiddenFieldBaseClientProps &
  Pick<ClientFieldBase, 'forceRender' | 'schemaPath'>
