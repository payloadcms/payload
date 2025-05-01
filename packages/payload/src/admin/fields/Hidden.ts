import type { ClientFieldBase } from '../types.js'

type HiddenFieldBaseClientProps = {
  readonly disableModifyingForm?: false
  readonly field?: never
  readonly path: string
  readonly potentiallyStalePath?: string
  readonly value?: unknown
}

export type HiddenFieldProps = HiddenFieldBaseClientProps &
  Pick<ClientFieldBase, 'forceRender' | 'schemaPath'>
