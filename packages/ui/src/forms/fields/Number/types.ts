import type { FormFieldBase } from '../shared.js'

export type Props = FormFieldBase & {
  name?: string
  onChange?: (e: number) => void
  path?: string
}
