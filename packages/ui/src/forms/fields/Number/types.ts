import type { FormFieldBase } from '../shared'

export type Props = FormFieldBase & {
  path?: string
  name?: string
  onChange?: (e: number) => void
}
