import type { FormFieldBase } from '../shared'

export type Props = FormFieldBase & {
  name?: string
  onChange?: (e: string) => void
  path?: string
  value?: string
}
