import type { FormFieldBase } from '../shared'

export type Props = FormFieldBase & {
  name?: string
  onChange?: (e: number) => void
  path?: string
}
