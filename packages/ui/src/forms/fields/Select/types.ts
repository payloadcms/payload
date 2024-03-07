import type { FormFieldBase } from '../shared.d.ts'

export type Props = FormFieldBase & {
  name?: string
  onChange?: (e: string) => void
  path?: string
  value?: string
}
